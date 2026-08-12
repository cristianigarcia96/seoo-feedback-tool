import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, FileImage, LogOut } from "lucide-react";
import type { Client, Page, Project } from "@/lib/types";
import { dataSource, repository } from "@/data";
import { useAuth } from "@/lib/auth";
import { CaptureUrlForm } from "@/features/capture/CaptureUrlForm";

interface ClientTree {
  client: Client;
  projects: Array<{ project: Project; pages: Page[] }>;
}

/** SEO-side landing: clients → projects → captured pages. Multi-tenant from the
 *  start; each page links into the editor. */
export function DashboardPage() {
  const { user, authEnabled, signOut } = useAuth();
  const navigate = useNavigate();
  const [tree, setTree] = useState<ClientTree[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const clients = await repository.listClients();
      const built: ClientTree[] = [];
      for (const client of clients) {
        const projects = await repository.listProjects(client.id);
        const withPages = [];
        for (const project of projects) {
          const pages = await repository.listPages(project.id);
          withPages.push({ project, pages });
        }
        built.push({ client, projects: withPages });
      }
      if (!cancelled) setTree(built);
    })().catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen pt-10 px-4 pb-20">
      <div className="w-full max-w-[900px] mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-[#B45532] font-semibold mb-1">
              SEO Feedback {dataSource === "demo" ? "· demo data" : ""}
            </div>
            <h1 className="font-serif text-2xl text-stone-800 mb-6">Clients &amp; snapshots</h1>
          </div>
          {authEnabled && user && (
            <div className="flex items-center gap-3 text-[12px] text-stone-500">
              <span className="truncate max-w-[180px]">{user.email}</span>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 hover:bg-stone-100 transition-colors"
              >
                <LogOut size={12} /> Sign out
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {!tree && !error && <p className="text-stone-400 text-sm">Loading…</p>}
        {tree && tree.length === 0 && !error && (
          <div className="bg-white border border-stone-200 rounded-lg p-6 text-sm text-stone-500">
            <p className="text-stone-700 font-medium mb-1">No clients yet.</p>
            <p>
              Your account isn't a member of any client workspace. Grant this user
              access to a client (see <code className="text-stone-600">seed.sql</code>) and it'll
              appear here.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {tree?.map(({ client, projects }) => (
            <section key={client.id} className="bg-white border border-stone-200 rounded-lg p-4">
              <h2 className="font-serif text-lg text-stone-800 mb-3">{client.name}</h2>
              {projects.length === 0 && <p className="text-stone-400 text-sm">No projects yet.</p>}
              <div className="space-y-4">
                {projects.map(({ project, pages }) => (
                  <div key={project.id}>
                    <div className="text-[12px] font-semibold text-stone-500 uppercase tracking-wide mb-2">
                      {project.name}
                    </div>
                    <ul className="space-y-1.5">
                      {pages.map((page) => (
                        <li key={page.id}>
                          <Link
                            to={`/editor/${page.id}`}
                            className="flex items-center gap-2 text-[13px] text-stone-700 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-md px-3 py-2 transition-colors"
                          >
                            <FileImage size={14} className="text-stone-400" />
                            <span className="flex-1 truncate">{page.sourceUrl}</span>
                            <span className="text-[11px] text-stone-400">{page.status}</span>
                            <ExternalLink size={13} className="text-stone-300" />
                          </Link>
                        </li>
                      ))}
                      {pages.length === 0 && (
                        <li className="text-stone-400 text-sm">No snapshots yet.</li>
                      )}
                    </ul>
                    <CaptureUrlForm
                      projectId={project.id}
                      onCaptured={(page) => navigate(`/editor/${page.id}`)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
