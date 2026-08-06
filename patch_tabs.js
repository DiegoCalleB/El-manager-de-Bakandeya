const fs = require('fs');
const content = fs.readFileSync('src/components/RepertorioSetlists.tsx', 'utf8');
const search = `          </button>\n        </div>`;
const replace = `          </button>\n\n          <button\n            id="tab-configuracion"\n            onClick={() => setActiveTab('configuracion')}\n            className={\`flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer whitespace-nowrap \${\n              activeTab === 'configuracion'\n                ? isStitchLight ? 'bg-slate-900 text-white shadow-sm font-semibold' : 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'\n                : 'text-neutral-400 hover:text-white'\n            }\`}\n          >\n            <Settings className="w-3.5 h-3.5" />\n            <span>Configuración</span>\n          </button>\n        </div>`;
fs.writeFileSync('src/components/RepertorioSetlists.tsx', content.replace(search, replace));
