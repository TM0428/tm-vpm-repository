const fs = require('fs');

const REPOS = [
  'TM0428/MaterialSetterToolforMA',
  'TM0428/CostumeSwitcherForMA'
];

const REPO_URL = 'https://tm0428.github.io/tm-vpm-repository/index.json';

async function build() {
  const indexJson = {
    name: "TM0428 VPM Packages",
    author: "TM0428",
    url: REPO_URL,
    id: "com.428-tm.vpm-repository",
    packages: {}
  };

  const headers = {};
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  for (const repo of REPOS) {
    console.log(`Fetching releases for ${repo}...`);
    const res = await fetch(`https://api.github.com/repos/${repo}/releases`, { headers });
    if (!res.ok) {
      console.error(`Failed to fetch releases for ${repo}: ${res.status} ${res.statusText}`);
      continue;
    }
    const releases = await res.json();
    
    for (const release of releases) {
      if (release.draft || release.prerelease) continue;

      const pkgAsset = release.assets.find(a => a.name === 'package.json');
      const zipAsset = release.assets.find(a => a.name.endsWith('.zip'));

      if (!pkgAsset || !zipAsset) {
        console.log(`Skipping release ${release.tag_name} - missing package.json or zip`);
        continue;
      }

      console.log(`Fetching package.json for ${release.tag_name}...`);
      const pkgRes = await fetch(pkgAsset.browser_download_url);
      if (!pkgRes.ok) {
        console.error(`Failed to download package.json for ${release.tag_name}`);
        continue;
      }

      const pkgData = await pkgRes.json();
      pkgData.url = zipAsset.browser_download_url;

      const pkgId = pkgData.name;
      if (!indexJson.packages[pkgId]) {
        indexJson.packages[pkgId] = { versions: {} };
      }
      indexJson.packages[pkgId].versions[pkgData.version] = pkgData;
    }
  }

  fs.writeFileSync('index.json', JSON.stringify(indexJson, null, 2));
  console.log('Successfully generated index.json');
}

build().catch(console.error);
