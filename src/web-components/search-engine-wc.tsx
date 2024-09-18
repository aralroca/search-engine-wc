// @ts-ignore
import Mark from "mark.js/src/vanilla.js";
import { navigate, type WebContext } from "brisa";
import MiniSearch from "minisearch";

const miniSearch = new MiniSearch({
  fields: ["title", "titles", "text"],
  storeFields: ["title", "titles"],
  searchOptions: {
    fuzzy: 0.2,
    prefix: true,
    boost: { title: 4, text: 2, titles: 1 },
  },
});

export default async function SearchEngineWC(
  { jsonUrl, color = "#07645A" }: { jsonUrl: string; color?: string },
  { state, cleanup, effect, css, self }: WebContext,
) {
  const inputRef = state<HTMLInputElement | null>(null);
  const searchResults = state<any[]>([]);
  const selected = state(0);
  const isExpanded = state(false);
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const metaKey = isMac ? "⌘+" : "Ctrl+";
  const minSearchWidth = isMac ? "80px" : "100px";
  let instance: Mark;

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      isExpanded.value = false;
      return;
    }

    if (!isExpanded.value && event.key === "k" && event.metaKey) {
      event.preventDefault();
      isExpanded.value = true;
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected.value = Math.min(
        selected.value + 1,
        searchResults.value.length - 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      selected.value = Math.max(selected.value - 1, 0);
      return;
    }

    if (event.key === "Enter") {
      const result = searchResults.value[selected.value];
      if (result) {
        event.preventDefault();
        navigate(result.id);
      }
      return;
    }
  }

  async function loadSearchModal() {
    if (!isExpanded.value) {
      document.body.style.overflow = "auto";
      return;
    }

    if (!instance) {
      instance = new Mark(
        self.shadowRoot?.querySelector(".results") as HTMLElement,
      );
    }

    const storage = sessionStorage.getItem(jsonUrl);

    if (storage) {
      miniSearch.addAll(JSON.parse(storage));
    } else {
      const response = await fetch(jsonUrl);
      const data = await response.json();
      miniSearch.addAll(data);
      sessionStorage.setItem(jsonUrl, JSON.stringify(data));
    }
  }

  function reset() {
    if (!isExpanded.value) return;

    requestAnimationFrame(() => {
      if (!inputRef.value) return;
      inputRef.value.value = "";
      inputRef.value.focus();
      searchResults.value = [];
      instance.unmark();
      selected.value = 0;
      document.body.style.overflow = "hidden";
    });
  }

  await effect(loadSearchModal);
  effect(reset);
  effect(() => document.addEventListener("keydown", onKeyDown));
  cleanup(() => document.removeEventListener("keydown", onKeyDown));

  css`
    .search-modal-container, .open-search {
      --color: ${color};
      --color-light: oklch(from var(--color) calc(l + .4) c  h);
    }

    .open-search {
      position: relative;
      color: var(--color);
      font-size: 12px;

      input {
        padding: 10px;
        border-radius: 9999px;
        border: 1px solid var(--color-light);
        background-color: #fff;
        color: var(--color);
        outline: none;
        width: ${minSearchWidth};,
      }
    }

    .search-modal-container {
      position: relative;
      top: 76px;
      left: 50%;
      transform: translateX(-50%);
      width: 50%;
      max-width: 900px;
      background-color: #fff;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

      input[type="search"] {
        padding: 8px 8px 8px 30px;
        border: 1px solid var(--color-light);
        background-color: #fff;
        color: var(--color);
        outline: none;
        width: 100%;
      }

      ul {
        padding: 10px 0 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;
        max-height: min(100vh - 208px, 900px);
        overscroll-behavior: contain;
      }

      li:has(a) {
        border: 2px solid #e2e2e3;
        border-radius: 4px;
        padding: 8px;
        list-style: none;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      li:has(a[aria-current="true"]) {
        border: 2px solid var(--color);
      }
    }

    .title:not(.main) {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .titles {
      display: flex;
      flex-wrap: wrap;
      color: var(--color);
      gap: 4px;
      align-items: center;
    }

    .title-icon {
      color: #080426;
      opacity: 0.5;
      font-weight: 500;
    }

    a {
      text-decoration: none;
      outline: none;
    }

    mark {
      background: var(--color);
      color: white;
    }

    .search-keyboard-shortcuts {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
      margin-top: 16px;
      font-size: 0.8rem;

      kbd {
        background: #f6f8fa;
        border: 1px solid var(--color-light);
        padding: 5px;
        margin: 0 4px;
        border-radius: 8px;
        pointer-events: none;
        color: var(--color);
      }
    }

    @media (max-width: 768px) {
      .search-modal-container {
        width: 100%;
        height: 100%;
        max-width: 100%;
        top: 0;
        left: 0;
        transform: none;
        padding: 16px 8px;
        border-radius: 0;

        input[type="search"] {
          padding-left: 40px;
        }
      }
    }
  `;

  return (
    <>
      <div class="open-search">
        <div
          style={{
            display: "flex",
            left: "0px",
            position: "absolute",
            alignItems: "center",
            transition: "all 300ms ease-in-out",
            width: minSearchWidth,
          }}
        >
          <input
            type="search"
            aria-placeholder="Search"
            aria-label="Search"
            onFocus={(e) => {
              (e.target as HTMLInputElement).blur();
              isExpanded.value = true;
            }}
          />
          {loupe({
            zIndex: 2,
            pointerEvents: "none",
            position: "absolute",
            left: "10px",
          })}
          <kbd
            style={{
              zIndex: 1,
              background: "white",
              border: "1px solid var(--color-light)",
              padding: "5px",
              borderRadius: "8px",
              pointerEvents: "none",
              position: "absolute",
              left: "32px",
              color,
              display: "block",
            }}
          >
            {metaKey}K
          </kbd>
        </div>
      </div>
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement)?.tagName !== "INPUT") {
            isExpanded.value = false;
          }
        }}
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          display: isExpanded.value ? "block" : "none",
          zIndex: 1000,
          width: "100vw",
          color,
          height: "100vh",
          cursor: "pointer",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <div class="search-modal-container">
          <input
            type="search"
            placeholder="Search"
            autoFocus
            ref={inputRef}
            onInput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const results = miniSearch.search(value);
              const terms = results.flatMap((r) => r.terms);
              searchResults.value = results;
              selected.value = 0;
              instance.mark(terms);
            }}
            tabIndex={0}
          />
          {loupe({
            zIndex: 2,
            pointerEvents: "none",
            position: "absolute",
            left: "26px",
            top: "29px  ",
          })}
          <ul aria-label="Results of search" class="results">
            {searchResults.value.length === 0 && inputRef.value?.value && (
              <li>
                No results for <b>{inputRef.value?.value}</b>
              </li>
            )}
            {searchResults.value.map((result, i) => (
              <li onMouseOver={() => (selected.value = i)}>
                <a
                  href={result.id}
                  onFocus={() => (selected.value = i)}
                  aria-current={selected.value === i ? true : false}
                  aria-label={[...result.titles, result.title].join(" > ")}
                >
                  <div class="titles">
                    <span class="title-icon">#</span>
                    {result.titles.map((t: string, index: number) => (
                      <span key={index} class="title">
                        <span class="text">{t}</span>
                        {arrowIcon({ direction: "right" })}
                      </span>
                    ))}
                    <span class="title main">
                      <span class="text">{result.title}</span>
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <div class="search-keyboard-shortcuts">
            <span>
              <kbd title="up arrow">
                {arrowIcon({ direction: "up", longArrow: true, size: 12 })}
              </kbd>
              <kbd title="down arrow">
                {arrowIcon({ direction: "down", longArrow: true, size: 12 })}
              </kbd>{" "}
              to navigate
            </span>
            <span>
              <kbd title="enter">{enterKeyboardArrow({ size: 12 })}</kbd> to
              select
            </span>
            <span>
              <kbd title="escape">esc</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function arrowIcon({
  direction = "up",
  longArrow = false,
  size = 16,
}: {
  direction?: "up" | "down" | "left" | "right";
  size?: number;
  longArrow?: boolean;
}) {
  const rotation = {
    up: 90,
    down: 270,
    left: 0,
    right: 180,
  }[direction];

  return (
    <svg
      width={size}
      height={size}
      style={{
        display: "inline-block",
        alignSelf: "center",
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
      }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={longArrow ? "M19 12H5M12 19l-7-7 7-7" : "M15 18L9 12L15 6"}
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function enterKeyboardArrow({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{ display: "inline-block" }}
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <path d="m9 10-5 5 5 5" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </svg>
  );
}

function loupe(style?: JSX.CSSProperties) {
  return (
    <svg
      style={style}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 19.707L16.707 15.414C17.538 14.35 18 13.05 18 11.5 18 7.364 14.636 4 10.5 4 6.364 4 3 7.364 3 11.5 3 15.636 6.364 19 10.5 19 12.05 19 13.35 18.538 14.414 17.707L18.707 21.707 21 19.707ZM5 11.5C5 8.467 7.467 6 10.5 6 13.533 6 16 8.467 16 11.5 16 14.533 13.533 17 10.5 17 7.467 17 5 14.533 5 11.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
