import express from "express";
import { getRegionForCity } from "../../src/constants/regions.js";
import { INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES } from "../../src/db_seed.js";
import { loadState, saveState, requireAuth, requireLeader, requireCronOrAuth } from "../state.js";

const router = express.Router();

function normalizeAgentName(name: string): string {
  const norm = (name || "").toLowerCase().trim();
  if (norm.includes("descubridor") || norm.includes("scout_descubridor") || norm.includes("scout-descubridor")) return "scout_descubridor";
  if (norm.includes("scout")) return "scout";
  if (norm.includes("redactor")) return "redactor";
  if (norm.includes("enviador") || norm.includes("enviado") || norm.includes("envio") || norm.includes("envío")) return "enviador";
  if (norm.includes("lector") || norm.includes("bandeja") || norm.includes("recepcion") || norm.includes("recepción")) return "lector";
  return norm;
}

// Trigger Python agents via GitHub Actions workflow_dispatch
router.post("/trigger-agent", requireCronOrAuth, async (req, res) => {
  const { agentName, params } = req.body;
  const pat = (req.headers["x-github-pat"] as string) || process.env.GITHUB_PAT;
  const owner = (req.headers["x-github-owner"] as string) || process.env.GITHUB_REPO_OWNER || "DiegoCalleB";
  const repo = (req.headers["x-github-repo"] as string) || process.env.GITHUB_REPO_NAME || "bakandeya-agent-manager";
  const ref = (req.headers["x-github-ref"] as string) || params?.ref || process.env.GITHUB_REF || "main";
  
  if (!agentName) {
    return res.status(400).json({ error: "Falta el nombre del agente." });
  }

  const normalizedAgentName = normalizeAgentName(agentName);
  const displayAgentName = normalizedAgentName.charAt(0).toUpperCase() + normalizedAgentName.slice(1);

  console.log(`[GitHub Actions API] Solicitud para ejecutar agente: ${agentName} (normalizado a: ${normalizedAgentName}) con params:`, params);

  if (!pat || pat === "") {
    return res.json({
      success: true,
      simulated: true,
      message: `[MODO SIMULACIÓN] Se ha simulado el disparo del agente '${displayAgentName}' en el repositorio ${owner}/${repo} con parámetros: ${JSON.stringify(params || {})} con la rama '${ref}'. Configura GITHUB_PAT en tus variables de entorno para conectarlo con tu repositorio real de GitHub Actions.`
    });
  }

  try {
    const workflowId = params?.workflowFile || "run-agents.yml";
    let activeRef = ref;

    let extraArgs = "";
    if (params) {
      const finalParams = { ...params };
      
      if (normalizedAgentName === "scout" || normalizedAgentName === "scout_descubridor") {
        if (finalParams.ciudad && !finalParams.region) {
          finalParams.region = getRegionForCity(finalParams.ciudad);
          delete finalParams.ciudad;
        }
      }

      const keys = Object.keys(finalParams).filter(k => k !== "workflowFile" && k !== "ref");
      extraArgs = keys.map(k => `--${k} "${finalParams[k]}"`).join(" ");
    }

    const triggerDispatch = async (branchRef: string, workflowFileToUse: string = workflowId) => {
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileToUse}/dispatches`;
      const authHeader = pat.startsWith("github_pat_") || pat.length > 40 ? `Bearer ${pat}` : `token ${pat}`;
      
      let res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Bakandeya-Manager-App",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ref: branchRef,
          inputs: {
            agent: normalizedAgentName,
            extra_args: extraArgs
          }
        })
      });

      if (res.status === 401 || res.status === 403 || res.status === 404) {
        if (res.status === 404 && workflowFileToUse === "run-agents.yml") {
          console.log(`[GitHub Actions API] No se encontró 'run-agents.yml'. Probando con el archivo alternativo 'run-agent.yml'...`);
          const resAltWorkflow = await triggerDispatch(branchRef, "run-agent.yml");
          if (resAltWorkflow.status === 204 || resAltWorkflow.status === 200 || resAltWorkflow.status === 422) {
            return resAltWorkflow;
          }
        }

        const altAuthHeader = authHeader.startsWith("Bearer") ? `token ${pat}` : `Bearer ${pat}`;
        console.log(`[GitHub Actions API] Status ${res.status}. Probando cabecera de autenticación alternativa...`);
        const resAlt = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": altAuthHeader,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Bakandeya-Manager-App",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ref: branchRef,
            inputs: {
              agent: normalizedAgentName,
              extra_args: extraArgs
            }
          })
        });
        if (resAlt.status === 204 || resAlt.status === 200 || resAlt.status === 422) {
          return resAlt;
        }
      }
      return res;
    };

    let response = await triggerDispatch(activeRef);

    if (response.status === 422) {
      console.log(`[GitHub Actions API] Error 422 con la rama '${activeRef}'. Intentando auto-detectar rama del repositorio...`);
      let detectedBranch: string | null = null;

      try {
        const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const authHeader = pat.startsWith("github_pat_") || pat.length > 40 ? `Bearer ${pat}` : `token ${pat}`;
        
        let repoRes = await fetch(repoUrl, {
          headers: {
            "Authorization": authHeader,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Bakandeya-Manager-App"
          }
        });

        if (!repoRes.ok) {
          const altAuthHeader = authHeader.startsWith("Bearer") ? `token ${pat}` : `Bearer ${pat}`;
          repoRes = await fetch(repoUrl, {
            headers: {
              "Authorization": altAuthHeader,
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "Bakandeya-Manager-App"
            }
          });
        }

        if (repoRes.ok) {
          const repoData = await repoRes.json();
          detectedBranch = repoData.default_branch;
          console.log(`[GitHub Actions API] Rama por defecto detectada en metadatos: '${detectedBranch}'`);
        }
      } catch (e: any) {
        console.error("Error al consultar detalles del repositorio:", e);
      }

      if (!detectedBranch) {
        try {
          const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
          const authHeader = pat.startsWith("github_pat_") || pat.length > 40 ? `Bearer ${pat}` : `token ${pat}`;
          
          let branchesRes = await fetch(branchesUrl, {
            headers: {
              "Authorization": authHeader,
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "Bakandeya-Manager-App"
            }
          });

          if (!branchesRes.ok) {
            const altAuthHeader = authHeader.startsWith("Bearer") ? `token ${pat}` : `Bearer ${pat}`;
            branchesRes = await fetch(branchesUrl, {
              headers: {
                "Authorization": altAuthHeader,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Bakandeya-Manager-App"
              }
            });
          }

          if (branchesRes.ok) {
            const branchesList = await branchesRes.json();
            if (Array.isArray(branchesList) && branchesList.length > 0) {
              const foundMain = branchesList.find(b => b.name === "main" || b.name === "master" || b.name === "develop");
              detectedBranch = foundMain ? foundMain.name : branchesList[0].name;
            }
          }
        } catch (e: any) {
          console.error("Error al listar las ramas del repositorio:", e);
        }
      }

      if (detectedBranch && detectedBranch !== activeRef) {
        const resAlt = await triggerDispatch(detectedBranch);
        if (resAlt.status === 204) {
          response = resAlt;
          activeRef = detectedBranch;
        }
      }

      if (response.status !== 204) {
        const commonBranches = ["main", "master", "develop", "dev"];
        for (const branch of commonBranches) {
          if (branch === activeRef || branch === ref || branch === detectedBranch) continue;
          try {
            const resAlt = await triggerDispatch(branch);
            if (resAlt.status === 204) {
              response = resAlt;
              activeRef = branch;
              break;
            }
          } catch (err) {
            console.error(`Error de red al probar rama de respaldo '${branch}':`, err);
          }
        }
      }
    }

    if (response.status === 204) {
      let msg = `¡Agente ${displayAgentName} iniciado con éxito en tu GitHub Actions!`;
      if (activeRef !== ref) {
        msg += ` (Detectamos automáticamente que tu rama principal es '${activeRef}' y la usamos en lugar de '${ref}')`;
      }
      msg += ` Puedes monitorizar la ejecución en tiempo real en: https://github.com/${owner}/${repo}/actions`;
      
      return res.json({
        success: true,
        simulated: false,
        detectedRef: activeRef,
        message: msg
      });
    } else {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `GitHub API retornó código ${response.status}: ${errorText}`
      });
    }
  } catch (err: any) {
    console.error("Error disparando el agente en GitHub:", err);
    return res.status(500).json({
      success: false,
      error: `Error al conectar con la API de GitHub: ${err.message}`
    });
  }
});

// GET /api/agent-runs - Get latest workflow runs
router.get("/agent-runs", async (req, res) => {
  const pat = (req.headers["x-github-pat"] as string) || process.env.GITHUB_PAT;
  const owner = (req.headers["x-github-owner"] as string) || process.env.GITHUB_REPO_OWNER || "DiegoCalleB";
  const repo = (req.headers["x-github-repo"] as string) || process.env.GITHUB_REPO_NAME || "bakandeya-agent-manager";

  if (!pat || pat === "") {
    return res.json({
      configured: false,
      runs: []
    });
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`;
    const authHeader = pat.startsWith("github_pat_") || pat.length > 40 ? `Bearer ${pat}` : `token ${pat}`;
    
    let response = await fetch(url, {
      headers: {
        "Authorization": authHeader,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Bakandeya-Manager-App"
      }
    });

    if (!response.ok) {
      const altAuthHeader = authHeader.startsWith("Bearer") ? `token ${pat}` : `Bearer ${pat}`;
      response = await fetch(url, {
        headers: {
          "Authorization": altAuthHeader,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Bakandeya-Manager-App"
        }
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Fallo al consultar runs de GitHub: ${errText}`
      });
    }

    const data = await response.json();
    const runs = (data.workflow_runs || []).map((run: any) => {
      let agent = undefined;
      const lowerName = (run.name || "").toLowerCase();
      const lowerHead = (run.head_commit?.message || "").toLowerCase();
      if (lowerName.includes("descubridor") || lowerName.includes("scout_descubridor") || lowerHead.includes("descubridor") || lowerHead.includes("scout_descubridor")) agent = "Scout Descubridor";
      else if (lowerName.includes("scout") || lowerHead.includes("scout")) agent = "Scout";
      else if (lowerName.includes("redactor") || lowerHead.includes("redactor")) agent = "Redactor";
      else if (lowerName.includes("enviador") || lowerHead.includes("enviador")) agent = "Enviador";
      else if (lowerName.includes("lector") || lowerHead.includes("lector") || lowerHead.includes("bandeja")) agent = "Lector";

      return {
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        html_url: run.html_url,
        created_at: run.created_at,
        updated_at: run.updated_at,
        run_number: run.run_number,
        event: run.event,
        display_title: run.display_title,
        trigger_agent: agent
      };
    });

    return res.json({
      configured: true,
      runs
    });
  } catch (err: any) {
    console.error("Error fetching agent runs from GitHub:", err);
    return res.status(500).json({
      success: false,
      error: `Error al conectar con la API de GitHub: ${err.message}`
    });
  }
});

// GET /api/agent-runs/:runId/jobs
router.get("/agent-runs/:runId/jobs", async (req, res) => {
  const { runId } = req.params;
  const pat = (req.headers["x-github-pat"] as string) || process.env.GITHUB_PAT;
  const owner = (req.headers["x-github-owner"] as string) || process.env.GITHUB_REPO_OWNER || "DiegoCalleB";
  const repo = (req.headers["x-github-repo"] as string) || process.env.GITHUB_REPO_NAME || "bakandeya-agent-manager";

  if (!pat || pat === "") {
    return res.status(400).json({ error: "No se ha configurado GITHUB_PAT." });
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
    const authHeader = pat.startsWith("github_pat_") || pat.length > 40 ? `Bearer ${pat}` : `token ${pat}`;
    
    let response = await fetch(url, {
      headers: {
        "Authorization": authHeader,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Bakandeya-Manager-App"
      }
    });

    if (!response.ok) {
      const altAuthHeader = authHeader.startsWith("Bearer") ? `token ${pat}` : `Bearer ${pat}`;
      response = await fetch(url, {
        headers: {
          "Authorization": altAuthHeader,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Bakandeya-Manager-App"
        }
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Fallo al consultar trabajos de GitHub: ${errText}`
      });
    }

    const data = await response.json();
    const jobs = (data.jobs || []).map((job: any) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      html_url: job.html_url,
      steps: (job.steps || []).map((step: any) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number
      }))
    }));

    return res.json({
      success: true,
      jobs
    });
  } catch (err: any) {
    console.error("Error fetching jobs from GitHub:", err);
    return res.status(500).json({
      success: false,
      error: `Error al conectar con la API de GitHub: ${err.message}`
    });
  }
});

// Reset database to initial seeds (Admin only)
router.post("/reset", requireAuth, requireLeader, (req, res) => {
  const { confirmReset, confirm } = req.body || {};
  if (confirmReset !== true && confirm !== "RESET" && confirm !== "RESET_CONFIRMED") {
    return res.status(400).json({
      error: "Petición de reseteo no confirmada. Se requiere 'confirmReset: true' en el cuerpo de la petición."
    });
  }
  const defaultState = {
    leads: INITIAL_LEADS,
    rehearsals: INITIAL_REHEARSALS,
    concerts: INITIAL_CONCERTS,
    posts: INITIAL_SOCIAL_POSTS,
    payments: INITIAL_PAYMENTS,
    messages: INITIAL_MESSAGES
  };
  saveState(defaultState);
  res.json({ success: true, state: defaultState });
});

export default router;
