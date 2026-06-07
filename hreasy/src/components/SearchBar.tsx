import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Briefcase, Loader2 } from 'lucide-react';
import { apiGlobalSearch } from '../services/api';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ users: any[], jobs: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiGlobalSearch(query);
        setResults(data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-48 lg:w-64" ref={dropdownRef}>
      <input
        type="text"
        placeholder="Search users, jobs..."
        value={query}
        onFocus={() => setShowDropdown(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        className="w-full pl-9 pr-4 py-1.5 text-xs bg-palette-3/40 dark:bg-slate-800 border border-palette-2/30 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 focus:bg-white text-palette-1 dark:text-white transition-all duration-200"
      />
      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-palette-2" />

      {/* Dropdown Results */}
      {showDropdown && query.length >= 2 && (
        <div className="absolute top-10 left-0 w-80 bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {loading && (
            <div className="p-4 text-center flex items-center justify-center gap-2 text-xs text-palette-2 dark:text-slate-400 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-palette-4" />
              Searching database...
            </div>
          )}

          {!loading && results && (results.users.length > 0 || results.jobs.length > 0) && (
            <div className="max-h-96 overflow-y-auto py-2">
              {/* Users Section */}
              {results.users.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-[9px] font-extrabold text-palette-2 dark:text-slate-500 uppercase tracking-wider px-4 mb-1">
                    People
                  </h4>
                  {results.users.map(user => (
                    <button 
                      key={user.id}
                      onClick={() => {
                        // In a real app, route to public profile
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-palette-3/50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-palette-2/10">
                        {user.photo_url ? (
                          <img src={user.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-palette-2 dark:text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-palette-1 dark:text-white truncate">
                          {user.name} <span className="font-normal text-palette-2 dark:text-slate-500 text-[10px]">({user.role})</span>
                        </p>
                        {user.tagline && (
                          <p className="text-[10px] text-palette-1/70 dark:text-slate-400 truncate">{user.tagline}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Jobs Section */}
              {results.jobs.length > 0 && (
                <div>
                  <h4 className="text-[9px] font-extrabold text-palette-2 dark:text-slate-500 uppercase tracking-wider px-4 mb-1 mt-2">
                    Jobs
                  </h4>
                  {results.jobs.map(job => (
                    <button 
                      key={job.id}
                      onClick={() => {
                        window.location.hash = '#/recruitment';
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-xl bg-palette-4/10 dark:bg-palette-4/20 flex items-center justify-center shrink-0 border border-palette-4/20">
                        <Briefcase className="w-3.5 h-3.5 text-palette-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-palette-1 dark:text-white truncate">{job.title}</p>
                        <p className="text-[10px] text-palette-2 dark:text-slate-400 truncate">
                          {job.department} • {job.location || 'Remote'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && results && results.users.length === 0 && results.jobs.length === 0 && (
            <div className="p-6 text-center text-xs text-palette-2 dark:text-slate-500 font-semibold italic">
              No users or jobs found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
