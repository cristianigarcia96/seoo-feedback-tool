import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileImage } from "lucide-react";
import type { Client, Page, Project } from "@/lib/types";
import { dataSource, repository } from "@/data";

interface ClientTree {
  client: Client;
  projects: Array<{ project: Project; pages: Page[] }>;
}

/** SEO-side landing: clients → projects → captured pages. Multi-tenant from the
 *  start; each page links into the editor. */
export function DashboardPage() {
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
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#B45532] font-semibold mb-1">
          SEO Feedback {dataSource === "demo" ? "· demo data" : ""}
        </div>
        <h1 className="font-serif text-2xl text-stone-800 mb-6">Clients &amp; snapshots</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {!tree && !error && <p className="text-stone-400 text-sm">Loading…</p>}

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
