import type { Project } from "./api-wrapper/types/project";

type GetProject = (id: string) => Promise<Project>;
type SearchByName = (query: string) => Promise<Project[]>;

export function searchForProjects(
  query: string,
  getProject: GetProject,
  searchByName: SearchByName,
): Promise<Project[]> {
  const trimmedQuery = query.trim();

  if (/^\d+$/.test(trimmedQuery)) {
    return getProject(trimmedQuery).then((project) => [project]);
  }

  return searchByName(query);
}
