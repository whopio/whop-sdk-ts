import { context, getOctokit } from "@actions/github";

const octo = getOctokit(process.env.GITHUB_TOKEN!);

const INITIAL_COMMIT = process.env.INITIAL_COMMIT!;
const version = "v" + process.env.VERSION!;

const { owner, repo } = context.repo;

const capitalise = (str: string) =>
  `${str.at(0)?.toUpperCase() || ""}${str.slice(1)}`;

const makeGithubReleaseMessage = (stats: ReleaseStats) =>
  `
${Object.entries(stats.pulls)
  .map(
    ([key, pulls]) => `
### ${capitalise(key)} Changes

${pulls.map(({ title }) => `- ${title}`).join("\n")}
`
  )
  .join("")}
### Credits
${Array.from(stats.authors)
  .map((author) => `@${author}`)
  .join(", ")}
`.trim();

type ReleasePulls = Record<
  string,
  {
    number: number;
    title: string;
  }[]
>;

type ReleaseStats = {
  authors: Set<string>;
  pulls: ReleasePulls;
};

const addPull = (
  pulls: ReleasePulls,
  type: string,
  number: number,
  title: string
) => {
  if (!pulls[type]) pulls[type] = [];
  pulls[type].push({ number, title });
};

const collectCommits = async (head: string, base: string = INITIAL_COMMIT) => {
  const stats: ReleaseStats = {
    authors: new Set(),
    pulls: {},
  };
  const {
    data: { commits },
  } = await octo.rest.repos.compareCommits({
    owner,
    repo,
    base,
    head,
    per_page: 100,
  });
  for (const commit of commits) {
    const PR = /\(#(\d+)\)$/.exec(commit.commit.message)?.[1];
    if (!PR) continue;
    if (commit.author?.login) {
      stats.authors.add(commit.author.login);
    }
    const { data: pr } = await octo.rest.pulls.get({
      repo,
      owner,
      pull_number: parseInt(PR),
    });
    const areas = pr.labels
      .filter(({ name }) => /^area: /.test(name))
      .map(({ name }) => name.replace(/^area: /, ""));

    if (!areas.length) {
      addPull(stats.pulls, "general", parseInt(PR), commit.commit.message);
    } else
      for (const area of areas)
        addPull(stats.pulls, area, parseInt(PR), commit.commit.message);
  }
  return stats;
};

const getLatestRelease = async (includePrerelease: boolean = true) => {
  if (includePrerelease) {
    const {
      data: [release],
    } = await octo.rest.repos.listReleases({
      repo,
      owner,
      per_page: 1,
    });
    return release;
  } else {
    try {
      const { data: release } = await octo.rest.repos.getLatestRelease({
        repo,
        owner,
      });
      return release;
    } catch {}
  }
};

const releaseExists = async (tag: string) => {
  try {
    await octo.rest.repos.getReleaseByTag({ repo, owner, tag });
    return true;
  } catch {
    return false;
  }
};

const getLatestCommit = async () => {
  const {
    data: [commit],
  } = await octo.rest.repos.listCommits({ repo, owner, per_page: 1 });
  return commit;
};

const release = async (
  head: string,
  stats: ReleaseStats,
  prerelease: boolean = true
) => {
  const { data: release } = await octo.rest.repos.createRelease({
    repo,
    owner,
    tag_name: version,
    body: makeGithubReleaseMessage(stats),
    target_commitish: head,
    prerelease,
  });
  console.log(release.html_url);
};

const main2 = async () => {
  if (await releaseExists(version)) {
    console.log(`${version} has already been release`);
    return;
  }
  const latestRelease = await getLatestRelease(false);
  const latestCommit = await getLatestCommit();
  const stats = await collectCommits(
    latestCommit.sha,
    latestRelease?.target_commitish
  );
  await release(
    latestCommit.sha,
    stats,
    /^v\d+\.\d+\.\d+-canary\.\d+$/.test(version)
  );
};
main2();
