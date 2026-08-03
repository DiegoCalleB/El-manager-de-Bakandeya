import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace footer completely
start_marker = "{/* Bottom User Profile */}"
end_marker = "</aside>"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_footer = """{/* Bottom User Profile */}
        <div className="p-4 mt-auto border-t border-[#22211F]/50">
          {currentUser && (
            <button 
              onClick={() => setShowUserProfileModal(true)}
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[#22211F] transition-colors cursor-pointer text-left border border-transparent hover:border-[#333130] mb-4"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[#121110] text-xs font-sans shrink-0 uppercase"
                style={{ backgroundColor: currentUser.avatarColor || '#eab308' }}
              >
                {currentUser.name.slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold font-sans text-zinc-100 truncate">
                  {currentUser.name}
                </span>
                <span className="text-[11px] font-sans text-[#9a9591] truncate">
                  {isAdmin ? 'Mánager' : currentUser.instrument || 'Músico'}
                </span>
              </div>
            </button>
          )}

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <img 
                src="/bandmanager_logo.jpeg" 
                alt="BandManager.ai" 
                className="w-5 h-5 rounded-md object-cover shrink-0 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all cursor-pointer"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold font-display tracking-wider text-neutral-400 uppercase leading-none">
                  BANDMANAGER<span className="text-neutral-500 font-sans lowercase text-[8px]">.ai</span>
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-[#22211F] transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      """
    
    content = content[:start_idx] + new_footer + content[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Footer Fixed")
