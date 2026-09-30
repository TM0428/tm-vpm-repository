// Keep the v2 components and design-token API compatible with this listing.
import { baseLayerLuminance, StandardLuminance, provideFluentDesignSystem, allComponents } from 'https://unpkg.com/@fluentui/web-components@2.6.1/dist/web-components.min.js';

provideFluentDesignSystem().register(allComponents);

const LISTING_URL = "https://tm0428.github.io/tm-vpm-repository/index.json";
let PACKAGES = {};

const setTheme = () => {
  const isDarkTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (isDarkTheme()) {
    baseLayerLuminance.setValueFor(document.documentElement, StandardLuminance.DarkMode);
  } else {
    baseLayerLuminance.setValueFor(document.documentElement, StandardLuminance.LightMode);
  }
}

async function fetchAndRenderPackages() {
  try {
    const response = await fetch('index.json');
    if (!response.ok) throw new Error(`Failed to load index.json: ${response.status}`);
    const data = await response.json();
    
    const packageGrid = document.getElementById('packageGrid');
    
    if (data.packages) {
      for (const [id, pkgData] of Object.entries(data.packages)) {
        const versions = Object.keys(pkgData.versions).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
        // Prefer a stable release over a prerelease such as 1.0.2-beta.
        const latestVersion = versions.find(version => !version.includes('-')) || versions[0];
        if (!latestVersion) continue;
        const latestPkg = pkgData.versions[latestVersion];

        PACKAGES[id] = {
          name: id,
          displayName: latestPkg.displayName || latestPkg.name,
          description: latestPkg.description || '',
          version: latestPkg.version,
          author: {
            name: latestPkg.author?.name || 'TM0428',
            url: latestPkg.author?.url || 'https://github.com/TM0428',
          },
          dependencies: latestPkg.vpmDependencies || {},
          zipUrl: latestPkg.url
        };

        const row = document.createElement('fluent-data-grid-row');
        row.setAttribute('data-package-name', PACKAGES[id].displayName);
        row.setAttribute('data-package-id', id);

        row.innerHTML = `
          <fluent-data-grid-cell grid-column="1">
            <div class="col">
              <div class="packageName">${PACKAGES[id].displayName}</div>
              <div class="caption1">${PACKAGES[id].description}</div>
              <div class="caption2">${id}</div>
            </div>
          </fluent-data-grid-cell>
          <fluent-data-grid-cell grid-column="2" class="row align-items-center">
            v${PACKAGES[id].version}
          </fluent-data-grid-cell>
          <fluent-data-grid-cell grid-column="3" class="row align-items-center justify-content-end">
            <fluent-button appearance="accent" class="rowAddToVccButton" data-package-id="${id}">Add to VCC</fluent-button>
            <fluent-button title="Package Info" class="rowPackageInfoButton ms-2" data-package-id="${id}">
              <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.4921 8.91012C10.4497 8.67687 10.2456 8.49999 10.0001 8.49999C9.72397 8.49999 9.50011 8.72385 9.50011 8.99999V13.5021L9.50817 13.592C9.55051 13.8253 9.75465 14.0021 10.0001 14.0021C10.2763 14.0021 10.5001 13.7783 10.5001 13.5021V8.99999L10.4921 8.91012ZM10.7988 6.74999C10.7988 6.33578 10.463 5.99999 10.0488 5.99999C9.63461 5.99999 9.29883 6.33578 9.29883 6.74999C9.29883 7.16421 9.63461 7.49999 10.0488 7.49999C10.463 7.49999 10.7988 7.16421 10.7988 6.74999ZM18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10ZM3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10Z"/>
              </svg>
            </fluent-button>
            <fluent-button class="rowMenuButton ms-2" appearance="stealth" data-package-url="${PACKAGES[id].zipUrl}">
              <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.25 10C6.25 10.6904 5.69036 11.25 5 11.25C4.30964 11.25 3.75 10.6904 3.75 10C3.75 9.30964 4.30964 8.75 5 8.75C5.69036 8.75 6.25 9.30964 6.25 10ZM11.25 10C11.25 10.6904 10.6904 11.25 10 11.25C9.30964 11.25 8.75 10.6904 8.75 10C8.75 9.30964 9.30964 8.75 10 8.75C10.6904 8.75 11.25 9.30964 11.25 10ZM15 11.25C15.6904 11.25 16.25 10.6904 16.25 10C16.25 9.30964 15.6904 8.75 15 8.75C14.3096 8.75 13.75 9.30964 13.75 10C13.75 10.6904 14.3096 11.25 15 11.25Z"/>
              </svg>
            </fluent-button>
          </fluent-data-grid-cell>
        `;
        packageGrid.appendChild(row);
      }
      setupEventListeners();
    }
    const packageStatus = document.getElementById('packageStatus');
    packageStatus.textContent = Object.keys(PACKAGES).length ? '' : '登録されたパッケージがありません。';
    packageStatus.hidden = Object.keys(PACKAGES).length > 0;
  } catch (err) {
    console.error("Error fetching packages:", err);
    const packageStatus = document.getElementById('packageStatus');
    packageStatus.textContent = 'パッケージ一覧を読み込めませんでした。ページを再読み込みしてください。';
    packageStatus.hidden = false;
  }
}

function setupEventListeners() {
  const packageGrid = document.getElementById('packageGrid');
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', ({ target: { value = '' }}) => {
    const items = packageGrid.querySelectorAll('fluent-data-grid-row:not([row-type="header"])');
    items.forEach(item => {
      if (value === '') {
        item.style.display = 'grid';
        return;
      }
      if (
        item.dataset?.packageName?.toLowerCase()?.includes(value.toLowerCase()) ||
        item.dataset?.packageId?.toLowerCase()?.includes(value.toLowerCase())
      ) {
        item.style.display = 'grid';
      } else {
        item.style.display = 'none';
      }
    });
  });

  const urlBarHelpButton = document.getElementById('urlBarHelp');
  const addListingToVccHelp = document.getElementById('addListingToVccHelp');
  urlBarHelpButton.addEventListener('click', () => {
    addListingToVccHelp.hidden = false;
  });
  const addListingToVccHelpClose = document.getElementById('addListingToVccHelpClose');
  addListingToVccHelpClose.addEventListener('click', () => {
    addListingToVccHelp.hidden = true;
  });

  const vccAddRepoButton = document.getElementById('vccAddRepoButton');
  vccAddRepoButton.addEventListener('click', () => window.location.assign(`vcc://vpm/addRepo?url=${encodeURIComponent(LISTING_URL)}`));

  const vccUrlFieldCopy = document.getElementById('vccUrlFieldCopy');
  vccUrlFieldCopy.addEventListener('click', () => {
    const vccUrlField = document.getElementById('vccUrlField');
    vccUrlField.select();
    navigator.clipboard.writeText(vccUrlField.value);
    vccUrlFieldCopy.appearance = 'accent';
    setTimeout(() => {
      vccUrlFieldCopy.appearance = 'neutral';
    }, 1000);
  });

  const rowMoreMenu = document.getElementById('rowMoreMenu');
  const hideRowMoreMenu = e => {
    if (rowMoreMenu.contains(e.target)) return;
    document.removeEventListener('click', hideRowMoreMenu);
    rowMoreMenu.hidden = true;
  }

  const rowMenuButtons = document.querySelectorAll('.rowMenuButton');
  rowMenuButtons.forEach(button => {
    button.addEventListener('click', e => {
      if (rowMoreMenu?.hidden) {
        rowMoreMenu.style.top = `${e.clientY + e.target.clientHeight}px`;
        rowMoreMenu.style.left = `${e.clientX - 120}px`;
        rowMoreMenu.hidden = false;

        const downloadLink = rowMoreMenu.querySelector('#rowMoreMenuDownload');
        // Clear old event listeners
        const newDownloadLink = downloadLink.cloneNode(true);
        downloadLink.parentNode.replaceChild(newDownloadLink, downloadLink);
        
        newDownloadLink.addEventListener('click', () => {
          const btn = e.target.closest('.rowMenuButton');
          window.open(btn.dataset?.packageUrl, '_blank');
        });

        setTimeout(() => {
          document.addEventListener('click', hideRowMoreMenu);
        }, 1);
      }
    });
  });

  const packageInfoModal = document.getElementById('packageInfoModal');
  const packageInfoModalClose = document.getElementById('packageInfoModalClose');
  packageInfoModalClose.addEventListener('click', () => {
    packageInfoModal.hidden = true;
  });

  const modalControl = packageInfoModal.shadowRoot.querySelector('.control');
  modalControl.style.maxHeight = "90%";
  modalControl.style.transition = 'height 0.2s ease-in-out';
  modalControl.style.overflowY = 'hidden';

  const packageInfoName = document.getElementById('packageInfoName');
  const packageInfoId = document.getElementById('packageInfoId');
  const packageInfoVersion = document.getElementById('packageInfoVersion');
  const packageInfoDescription = document.getElementById('packageInfoDescription');
  const packageInfoAuthor = document.getElementById('packageInfoAuthor');
  const packageInfoDependencies = document.getElementById('packageInfoDependencies');

  const rowAddToVccButtons = document.querySelectorAll('.rowAddToVccButton');
  rowAddToVccButtons.forEach((button) => {
    button.addEventListener('click', () => window.location.assign(`vcc://vpm/addRepo?url=${encodeURIComponent(LISTING_URL)}`));
  });

  const rowPackageInfoButton = document.querySelectorAll('.rowPackageInfoButton');
  rowPackageInfoButton.forEach((button) => {
    button.addEventListener('click', e => {
      const btn = e.target.closest('.rowPackageInfoButton');
      const packageId = btn.dataset?.packageId;
      const packageInfo = PACKAGES?.[packageId];
      if (!packageInfo) return;

      packageInfoName.textContent = packageInfo.displayName;
      packageInfoId.textContent = packageId;
      packageInfoVersion.textContent = `v${packageInfo.version}`;
      packageInfoDescription.textContent = packageInfo.description;
      packageInfoAuthor.textContent = packageInfo.author.name;
      packageInfoAuthor.href = packageInfo.author.url;

      packageInfoDependencies.innerHTML = null;
      Object.entries(packageInfo.dependencies).forEach(([name, version]) => {
        const depRow = document.createElement('li');
        depRow.classList.add('mb-2');
        depRow.textContent = `${name} @ ${version}`;
        packageInfoDependencies.appendChild(depRow);
      });

      packageInfoModal.hidden = false;

      setTimeout(() => {
        const height = packageInfoModal.querySelector('.col').clientHeight;
        modalControl.style.setProperty('--dialog-height', `${height + 14}px`);
      }, 1);
    });
  });
}

(() => {
  setTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTheme());
  fetchAndRenderPackages();
})();
