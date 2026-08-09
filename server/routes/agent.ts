import express from "express";
import { getRegionForCity } from "../../src/constants/regions.js";
import { INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES } from "../../src/db_seed.js";
import { loadState, saveState, requireAuth, requireLeader, requireCronOrAuth, getAutonomyConfigForBand } from "../state.js";
import { parsePrivateKey } from "../sheets.js";

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
  const rawRef = (req.headers["x-github-ref"] as string) || params?.ref || process.env.GITHUB_REF;
  const ref = rawRef && rawRef.trim() !== "" ? rawRef : "master";
  
  if (!agentName) {
    return res.status(400).json({ error: "Falta el nombre del agente." });
  }

  const normalizedAgentName = normalizeAgentName(agentName);
  const displayAgentName = normalizedAgentName.charAt(0).toUpperCase() + normalizedAgentName.slice(1);

  console.log(`[GitHub Actions API] Solicitud para ejecutar agente: ${agentName} (normalizado a: ${normalizedAgentName}) con params:`, params);

  if (!pat || pat === "") {
    if (normalizedAgentName === "scout_descubridor" || normalizedAgentName === "scout") {
      try {
        const targetLoc = params?.ciudad || params?.region || "Huelva";
        const state = loadState();
        const dateTag = new Date().toLocaleDateString();
        const norm = targetLoc.toLowerCase();

        let newSimLeads: any[] = [];
        if (norm.includes("huelva")) {
          newSimLeads = [
            {
              id: `sim-huelva-1-${Date.now()}`,
              nombre_sala: "Gran Teatro de Huelva",
              ciudad: "Huelva",
              region: "Andalucía",
              aforo: 600,
              genero: "Música / Teatro / Mestizaje",
              tipo: params?.tipo || "Teatro/Sala",
              email_contacto: "programacion@teatrohuelva.es",
              telefono: "+34 959 21 01 00",
              instagram: "@teatrohuelva",
              fuente: "Scout Descubridor: Huelva",
              estado: "nuevo",
              pitch_generado: "",
              notas: `Descubierto para Huelva (${dateTag}).`
            },
            {
              id: `sim-huelva-2-${Date.now()}`,
              nombre_sala: "Foro Iberoamericano de La Rábida",
              ciudad: "Palos de la Frontera (Huelva)",
              region: "Andalucía",
              aforo: 2500,
              genero: "Festivales / Conciertos",
              tipo: "Festival",
              email_contacto: "cultura@diphuelva.es",
              telefono: "+34 959 53 05 00",
              instagram: "@diphuelva",
              fuente: "Scout Descubridor: Huelva",
              estado: "nuevo",
              pitch_generado: "",
              notas: `Descubierto para Huelva (${dateTag}).`
            }
          ];
        } else if (norm.includes("sevilla") || norm.includes("andaluc")) {
          newSimLeads = [
            {
              id: `sim-sevilla-1-${Date.now()}`,
              nombre_sala: "Sala Custom",
              ciudad: "Sevilla",
              region: "Andalucía",
              aforo: 1000,
              genero: "Rock / Electronica / Fusion",
              tipo: params?.tipo || "Sala",
              email_contacto: "info@salacustom.com",
              telefono: "+34 954 51 52 53",
              instagram: "@salacustom",
              fuente: "Scout Descubridor: Sevilla",
              estado: "nuevo",
              pitch_generado: "",
              notas: `Descubierto para Sevilla (${dateTag}).`
            }
          ];
        } else {
          const capLoc = targetLoc.charAt(0).toUpperCase() + targetLoc.slice(1);
          newSimLeads = [
            {
              id: `sim-gen-1-${Date.now()}`,
              nombre_sala: `Gran Espacio Musical de ${capLoc}`,
              ciudad: capLoc,
              region: capLoc,
              aforo: 550,
              genero: "Música en Directo / Fusion",
              tipo: params?.tipo || "Sala",
              email_contacto: `booking@espacio${capLoc.toLowerCase().replace(/\s+/g, '')}.es`,
              telefono: "+34 900 12 34 56",
              instagram: `@espacio_${capLoc.toLowerCase().replace(/\s+/g, '_')}`,
              fuente: `Scout Descubridor: ${capLoc}`,
              estado: "nuevo",
              pitch_generado: "",
              notas: `Descubierto para ${capLoc} (${dateTag}).`
            }
          ];
        }

        // Avoid exact duplicate IDs
        const existingIds = new Set(state.leads.map((l: any) => l.id));
        const filteredNew = newSimLeads.filter(l => !existingIds.has(l.id));
        state.leads = [...state.leads, ...filteredNew];
        saveState(state);
        console.log(`[MODO SIMULACIÓN] Añadidos ${filteredNew.length} leads de simulación para '${targetLoc}'`);
      } catch (e) {
        console.error("Error al guardar leads de simulación:", e);
      }
    }

    return res.json({
      success: true,
      simulated: true,
      message: `[MODO SIMULACIÓN] Se ha simulado el disparo del agente '${displayAgentName}' en el repositorio ${owner}/${repo} con parámetros: ${JSON.stringify(params || {})} con la rama '${ref}'. Configura GITHUB_PAT en tus variables de entorno para conectarlo con tu repositorio real de GitHub Actions.`
    });
  }

  try {
    let activeRef = ref;
    const finalParams: Record<string, any> = { ...(params || {}) };
    
    let extraArgs = "";

    if (normalizedAgentName === "scout_descubridor") {
      let region = finalParams.region || finalParams.ciudad;
      if (!region && finalParams.ciudad) {
        region = getRegionForCity(finalParams.ciudad);
      }
      if (!region) region = "Huelva";

      let tipo = finalParams.tipo || "sala";
      const cleanRegion = String(region).replace(/['"\r\n]/g, "").trim().replace(/\s+/g, "-");
      const cleanTipo = String(tipo).replace(/['"\r\n]/g, "").trim().replace(/\s+/g, "-");

      const parts = [`--region "${cleanRegion}"`, `--tipo "${cleanTipo}"`];
      if (finalParams.limit) parts.push(`--limit ${parseInt(finalParams.limit, 10)}`);
      extraArgs = parts.join(" ");

    } else if (normalizedAgentName === "scout") {
      const parts: string[] = [];
      if (finalParams.limit) parts.push(`--limit ${parseInt(finalParams.limit, 10)}`);
      if (finalParams.all) parts.push("--all");
      let region = finalParams.region;
      if (!region && finalParams.ciudad) region = getRegionForCity(finalParams.ciudad);
      if (region) {
        const cleanRegion = String(region).replace(/['"\r\n]/g, "").trim().replace(/\s+/g, "-");
        parts.push(`--region "${cleanRegion}"`);
      }
      extraArgs = parts.join(" ");

    } else if (normalizedAgentName === "redactor") {
      const parts: string[] = [];
      if (finalParams.limit) parts.push(`--limit ${parseInt(finalParams.limit, 10)}`);
      if (finalParams.all) parts.push("--all");
      if (finalParams.id) {
        const cleanId = String(finalParams.id).replace(/['"\r\n]/g, "").trim();
        parts.push(`--id "${cleanId}"`);
      }
      if (finalParams.regenerate) parts.push("--regenerate");
      extraArgs = parts.join(" ");

    } else {
      const ignoredKeys = new Set(["workflowFile", "ref", "agent", "agentName", "agent_name", "spreadsheet_id", "spreadsheetId", "spreadsheet", "ciudad", "autonomyConfig"]);
      const keys = Object.keys(finalParams).filter(k => !ignoredKeys.has(k));
      extraArgs = keys.map(k => {
        const cleanVal = String(finalParams[k]).replace(/['"\r\n]/g, "").trim();
        return `--${k} "${cleanVal}"`;
      }).join(" ");
    }

    const state = loadState();
    const user = (req as any).user;
    const bandId = user?.band_id || "band-bakandeya";
    const autonomy = finalParams.autonomyConfig || getAutonomyConfigForBand(state, bandId);

    const autonomyParts = [
      `--dispatch-level "${autonomy.dispatchLevel || 'draft_only'}"`,
      `--negotiation-depth "${autonomy.negotiationDepth || 'filter_conditions'}"`,
      `--min-cache ${autonomy.minCacheThreshold ?? 300}`,
      `--max-cache ${autonomy.maxCacheThreshold ?? 800}`,
      `--auto-decline ${autonomy.autoDeclineUnderMinCache ? 'true' : 'false'}`
    ];

    extraArgs = extraArgs ? `${extraArgs} ${autonomyParts.join(" ")}` : autonomyParts.join(" ");

    const workflowCandidates = [
      params?.workflowFile,
      "run-agents.yml",
      "run-agent.yml",
      "agents.yml",
      "agent.yml",
      "main.yml"
    ].filter((w, idx, self) => Boolean(w) && self.indexOf(w) === idx) as string[];

    const triggerDispatch = async (branchRef: string, workflowFileToUse: string = workflowCandidates[0]) => {
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

      if (res.status === 404 && workflowCandidates.indexOf(workflowFileToUse) < workflowCandidates.length - 1) {
        const nextWorkflow = workflowCandidates[workflowCandidates.indexOf(workflowFileToUse) + 1];
        console.log(`[GitHub Actions API] No se encontró '${workflowFileToUse}'. Probando con el archivo alternativo '${nextWorkflow}'...`);
        return await triggerDispatch(branchRef, nextWorkflow);
      }

      if (res.status === 401 || res.status === 403) {
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

// GET /api/github-secrets-helper - Provide formatted credentials JSON for GitHub Repository Secrets
router.get("/github-secrets-helper", requireCronOrAuth, (req, res) => {
  let email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.SERVICE_ACCOUNT_EMAIL || "bakandeya-sheets@bakandeya-management.iam.gserviceaccount.com";
  const spreadsheetId = process.env.SPREADSHEET_ID || "1tsHUosgn1VQMvlRxe6LBJgAq7vtysXPrfWviik026-I";
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

  let serviceAccountJson = "";
  const possibleJsonCreds = [
    process.env.GCP_SA_KEY,
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_CREDENTIALS,
    process.env.GOOGLE_SHEETS_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  ];

  for (const rawVal of possibleJsonCreds) {
    if (rawVal && rawVal.trim().length > 0) {
      try {
        let str = rawVal.trim();
        if (!str.startsWith("{") && str.length > 100 && !str.includes(" ")) {
          try {
            const decoded = Buffer.from(str, "base64").toString("utf-8");
            if (decoded.includes("{") && decoded.includes("private_key")) {
              str = decoded;
            }
          } catch (_) {}
        }
        const parsed = JSON.parse(str);
        if (parsed.private_key && parsed.client_email) {
          serviceAccountJson = JSON.stringify(parsed, null, 2);
          email = parsed.client_email;
          break;
        }
      } catch (_) {}
    }
  }

  if (!serviceAccountJson) {
    const parsedKey = parsePrivateKey(rawKey);
    if (parsedKey) {
      serviceAccountJson = JSON.stringify({
        type: "service_account",
        project_id: "bakandeya-management",
        private_key_id: "bakandeya-key-01",
        private_key: parsedKey,
        client_email: email,
        client_id: "109823746592837465928",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
      }, null, 2);
    }
  }

  res.json({
    configured: !!serviceAccountJson,
    spreadsheetId,
    clientEmail: email,
    serviceAccountJson
  });
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
