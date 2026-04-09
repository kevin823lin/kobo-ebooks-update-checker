// ==UserScript==
// @name               Kobo e-Books Update Checker
// @name:zh-TW         Kobo 電子書更新檢查器
// @description        Checks if updates were available for the e-books you own.
// @description:zh-TW  檢查你購買的電子書是否有更新檔提供。
// @icon               https://icons.duckduckgo.com/ip3/www.kobo.com.ico
// @author             kevin823lin
// @contributor        Jason Kwok (Original Author)
// @namespace          https://github.com/kevin823lin
// @version            1.8.1-fork.1
// @license            MIT
// @match              https://www.kobo.com/*/*/library/books
// @match              https://www.kobo.com/*/*/library/books?*
// @match              https://www.kobo.com/*/*/library/Books
// @match              https://www.kobo.com/*/*/library/Books?*
// @match              https://www.kobo.com/*/*/library/archive
// @match              https://www.kobo.com/*/*/library/archive?*
// @run-at             document-end
// @grant              GM.setClipboard
// @require            https://update.greasyfork.org/scripts/483122/1303118/style-shims.js
// @require            https://unpkg.com/typesafe-i18n@5.26.2/dist/i18n.object.min.js
// @require            https://update.greasyfork.org/scripts/482311/1297431/queue.js
// ==/UserScript==

const LL = (function () {
  const translations = {
    en: {
      HEADER: {
        MESSAGE: "Message",
        RESULT: "Check Result",
      },
      BUTTON: {
        OKAY: "Okay",
        CHECK_PAGE: "Check Update for Page",
        CHECKING_PAGE: "Checking Update...",
        CHECK_SINGLE: "Check Update",
        COPY_OUTDATED: "Copy Outdated Books",
        VIEW_RESULT: "View Check Results",
        COPIED: "Copied",
        CONFIRM: "Confirm",
        CANCEL: "Cancel",
      },
      STATUS: {
        PENDING: "Pending...",
        CHECKING: "Checking...",
        LATEST: "Latest",
        OUTDATED: "Outdated",
        PREVIEW: "Preview",
        SKIPPED: "Skipped",
        FAILED: "Failed",
      },
      ERROR: {
        UNLISTED:
          "This book was unlisted, there’s no way to check update for this type of books at the moment.",
        PARSING:
          "Failed to parse the latest product ID, please contact the developer for further investigations.",
        UNKNOWN:
          "Unknown error, please contact the developer for further investigations.",
      },
      MESSAGE: {
        FINISHED_CHECKING_PAGE:
          "Finished checking all books for this page.\n\nLatest: {latest}\nOutdated: {outdated}\nSkipped: {skipped}\nFailed: {failed}",
        NO_BOOKS_BEEN_CHECKED: "No books have been checked.",
        NO_BOOKS_WERE_OUTDATED: "No books were outdated.",
        COPIED_BOOKS: "Copied {0} book{{s}} into the clipboard.",
        CONFIRM_RECHECK:
          "This page has already been checked.\nAre you sure you want to check again?",
        ALL_LATEST: "All books are up to date.",
      },
    },
    zh: {
      HEADER: {
        MESSAGE: "訊息",
        RESULT: "檢查結果",
      },
      BUTTON: {
        OKAY: "確定",
        CHECK_PAGE: "為本頁檢查更新",
        CHECKING_PAGE: "正在檢查更新…",
        CHECK_SINGLE: "檢查更新",
        COPY_OUTDATED: "複製過時書籍",
        VIEW_RESULT: "查看檢查結果",
        COPIED: "已複製",
        CONFIRM: "確認",
        CANCEL: "取消",
      },
      STATUS: {
        PENDING: "等待中…",
        CHECKING: "檢查中…",
        LATEST: "最新",
        OUTDATED: "過時",
        PREVIEW: "預覽",
        SKIPPED: "已略過",
        FAILED: "檢查失敗",
      },
      ERROR: {
        UNLISTED: "該書已下架，目前尚未有方法為這類書籍檢查更新。",
        PARSING: "無法解析最新的產品編號，請聯絡開發者以進一步調查。",
        UNKNOWN: "未知錯誤，請聯絡開發者以進一步調查。",
      },
      MESSAGE: {
        FINISHED_CHECKING_PAGE:
          "完成檢查本頁的書籍。\n\n最新：{latest}\n過時：{outdated}\n已略過：{skipped}\n檢查失敗：{failed}",
        NO_BOOKS_BEEN_CHECKED: "沒有已檢查的書籍。",
        NO_BOOKS_WERE_OUTDATED: "沒有過時的書籍。",
        COPIED_BOOKS: "已複製 {0} 本書到剪貼簿。",
        CONFIRM_RECHECK:
          "此頁已完成一次檢查。\n確定要再次檢查嗎？",
        ALL_LATEST: "所有書籍皆為最新版本。",
      },
    },
  };

  let locale = location.pathname.match(/\/[a-z]{2}\/([a-z]{2})\//)?.[1] ?? "en";
  if (!Object.keys(translations).includes(locale)) {
    console.warn("No translations available for this locale.");
    locale = "en";
  }

  return i18nObject(locale, translations[locale]);
})();

GM.addStyle(`
    .library-container .update-container
    {
        text-align: right;
    }
 
    .library-container .update-controls
    {
        min-width: 13rem;
        width: auto;
    }
 
    .library-container .update-button
    {
        border-radius: 20px;
        min-width: 0;
        max-width: 100%;
        width: auto;
        overflow: hidden;
        background-color: #eee;
        color: #000;
        font-size: 1.6rem;
        font-family: "Rakuten Sans UI", "Trebuchet MS", Trebuchet, Arial, Helvetica, sans-serif;
        font-weight: 400;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
        position: relative;
        white-space: nowrap;
        transition: background-color .3s ease-in-out, color .15s ease-in-out 0s;
    }
 
    .library-container .update-button:not(:first-child)
    {
        margin-left: 5px;
    }
 
    .library-container .update-button:not(:last-child)
    {
        margin-right: 5px;
    }
 
    .library-container .update-button::before
    {
        position: absolute;
        top: calc(50% - 30px);
        border-radius: 80px;
        width: calc(100% - 30px);
        height: 60px;
        background-color: rgba(0, 0, 0, .1);
        content: "";
        opacity: 0;
        transform: scale(0);
    }
 
    .library-container .update-button:disabled
    {
        background-color: "#dcdcdc";
        color: rgba(0,0,0,.42);
        pointer-events: none;
    }
 
    .library-container .update-button:hover
    {
        background-color: rgba(0, 0, 0, .04);
    }
 
    .library-container .update-button:focus::before
    {
        opacity: 1;
        transform: scale(1);
    }
 
    .library-container .update-button:active
    {
        background-color: #000;
        color: #fff;
    }
 
    @media (max-width: 568px)
    {
        .library-container .secondary-controls
        {
            margin-right: 18px;
        }
 
        .library-container .update-container
        {
            margin-bottom: 1.5rem;
            width: 100%;
            display: flex;
            flex-direction: column;
            text-align: left;
        }
 
        .library-container .update-controls
        {
            margin-right: 0;
            width: 100%;
            white-space: break-spaces;
        }
 
        .library-container .update-button
        {
            margin-left: 0 !important;
            margin-right: 0 !important;
            width: 100%;
            text-align: center;
        }
 
        .library-container .update-button:not(:first-child)
        {
            margin-top: 8px;
        }
 
        .library-container .library-content.grid .more-actions:not(.open)
        {
            width: fit-content;
            transform: translateY(35px);
        }
    }
 
    .item-wrapper.book[data-check-status=outdated] .product-field.item-status
    {
        background: #FE8484;
    }
 
    .item-wrapper.book[data-check-status=skipped] .product-field.item-status
    {
        background: #B5B5B5;
    }
 
    .item-wrapper.book[data-check-status=failed] .product-field.item-status
    {
        background: #FFA700;
    }
 
    .item-wrapper.book:is([data-check-status=skipped], [data-check-status=failed]) .product-field.item-status a
    {
        text-decoration-line: underline;
        cursor: help;
    }
 
    .result-book-list
    {
        max-height: 250px;
        overflow-y: auto;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 8px;
        margin-top: 12px;
        text-align: left;
    }
 
    .result-book-list ul
    {
        list-style: none;
        padding: 0;
        margin: 0;
    }
 
    .result-book-list li
    {
        padding: 6px 8px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
 
    .result-book-list li:last-child
    {
        border-bottom: none;
    }
 
    .result-book-list .status-tag
    {
        font-size: 1.2rem;
        padding: 2px 8px;
        border-radius: 10px;
        white-space: nowrap;
        margin-left: 8px;
        flex-shrink: 0;
    }
 
    .result-book-list .status-tag.outdated
    {
        background: #FE8484;
        color: #fff;
    }
 
    .result-book-list .status-tag.skipped
    {
        background: #B5B5B5;
        color: #fff;
    }
 
    .result-book-list .status-tag.failed
    {
        background: #FFA700;
        color: #fff;
    }
 
    .result-book-list .status-tag.latest
    {
        background: #4CAF50;
        color: #fff;
    }
 
`);

/**
 * 建立 Modal 的共用骨架。
 * @param {Object} options
 * @param {string} options.title - 標題文字
 * @param {string} options.message - 訊息文字（支援 \n 換行）
 * @param {string} options.messageStyle - 訊息樣式
 * @param {HTMLElement[]} [options.extraContent] - 插入於訊息與按鈕之間的額外 DOM 節點
 * @param {Array<{text: string, className: string, onClick?: Function, action?: string, disabled?: boolean}>} options.buttons - 按鈕定義
 * @returns {{ modal: HTMLElement, closeModal: Function }}
 */
function createModalBase({ title, message, messageStyle, extraContent = [], buttons }) {
  const modal = document.createElement("div");
  modal.id = "modal";

  function closeModal() {
    if (document.querySelectorAll("#modal").length > 1) {
      modal.remove();
    } else {
      document.body.classList.remove("show-modal");
      setTimeout(() => modal.remove(), 250);
    }
  }

  modal.addEventListener(
    "click",
    (event) => event.target === modal && closeModal(),
  );

  const modalContent = document.createElement("div");
  modalContent.id = "modal-content";
  modalContent.classList.add("library-modal");

  const modalContainer = document.createElement("div");

  const closeWrapper = document.createElement("div");
  closeWrapper.classList.add("wrapper");

  const closeButton = document.createElement("button");
  closeButton.classList.add("modal-x", "close");
  closeButton.addEventListener("click", closeModal);

  const actionWrapper = document.createElement("div");
  actionWrapper.classList.add("wrapper");

  const actionContainer = document.createElement("div");
  actionContainer.classList.add("action-container");

  const actionHeader = document.createElement("h2");
  actionHeader.classList.add("confirm");
  actionHeader.textContent = title;

  const actionMessage = document.createElement("p");
  if (messageStyle) actionMessage.style = messageStyle;
  actionMessage.innerHTML = String(message).replaceAll("\n", "<br />");

  const actionButtons = document.createElement("div");
  actionButtons.classList.add("cta");

  for (const btnDef of buttons) {
    const btn = document.createElement("button");
    btn.className = btnDef.className;
    btn.textContent = btnDef.text;
    if (btnDef.disabled) {
      btn.disabled = true;
    }
    if (btnDef.action === "close") {
      btn.addEventListener("click", closeModal);
    } else if (btnDef.onClick) {
      btn.addEventListener("click", () => btnDef.onClick(closeModal, btn));
    }
    actionButtons.append(btn);
  }

  closeWrapper.append(closeButton);
  actionContainer.append(actionHeader, actionMessage, ...extraContent, actionButtons);
  actionWrapper.append(actionContainer);
  modalContainer.append(closeWrapper, actionWrapper);
  modalContent.append(modalContainer);
  modal.append(modalContent);
  document.body.append(modal);

  document.body.classList.add("show-modal");

  return { modal, closeModal };
}

function showModal(message) {
  createModalBase({
    title: LL.HEADER.MESSAGE(),
    message,
    buttons: [
      { text: LL.BUTTON.OKAY(), className: "primary-button okay", action: "close" },
    ],
  });
}

function showConfirmModal(message, onConfirm) {
  createModalBase({
    title: LL.HEADER.MESSAGE(),
    message,
    buttons: [
      {
        text: LL.BUTTON.CONFIRM(),
        className: "primary-button",
        onClick: (closeModal) => { closeModal(); onConfirm(); },
      },
      { text: LL.BUTTON.CANCEL(), className: "secondary-button close", action: "close" },
    ],
  });
}

function showResultModal(books) {
  const outdatedBooks = books.filter(
    (b) => b.dataset.checkStatus === Status.OUTDATED,
  );
  const skippedBooks = books.filter(
    (b) => b.dataset.checkStatus === Status.SKIPPED,
  );
  const failedBooks = books.filter(
    (b) => b.dataset.checkStatus === Status.FAILED,
  );
  const latestBooks = books.filter(
    (b) => b.dataset.checkStatus === Status.LATEST,
  );

  const summaryText = LL.MESSAGE.FINISHED_CHECKING_PAGE({
    latest: latestBooks.length,
    outdated: outdatedBooks.length,
    skipped: skippedBooks.length,
    failed: failedBooks.length,
  });

  const bookListContainer = document.createElement("div");
  bookListContainer.classList.add("result-book-list");

  const nonLatestBooks = [...outdatedBooks, ...skippedBooks, ...failedBooks];

  if (nonLatestBooks.length > 0) {
    const ul = document.createElement("ul");
    for (const book of nonLatestBooks) {
      const li = document.createElement("li");

      const titleSpan = document.createElement("span");
      titleSpan.textContent = getBookTitle(book);

      const statusTag = document.createElement("span");
      statusTag.classList.add("status-tag", book.dataset.checkStatus);
      const statusKey = book.dataset.checkStatus.toUpperCase();
      statusTag.textContent = LL.STATUS[statusKey]();

      li.append(titleSpan, statusTag);
      ul.append(li);
    }
    bookListContainer.append(ul);
  } else {
    const allLatestMsg = document.createElement("p");
    allLatestMsg.style = "text-align: center; color: #4CAF50; margin: 12px 0;";
    allLatestMsg.textContent = LL.MESSAGE.ALL_LATEST();
    bookListContainer.append(allLatestMsg);
  }

  createModalBase({
    title: LL.HEADER.RESULT(),
    message: summaryText,
    messageStyle: "display: inline-block; text-align: left;",
    extraContent: [bookListContainer],
    buttons: [
      { text: LL.BUTTON.OKAY(), className: "primary-button okay", action: "close" },
      {
        text: LL.BUTTON.COPY_OUTDATED(),
        className: "primary-button",
        disabled: outdatedBooks.length === 0,
        onClick: (_closeModal, buttonEl) => {
          GM.setClipboard(outdatedBooks.map(getBookTitle).join("\n"));
          const originalText = buttonEl.textContent;
          buttonEl.textContent = LL.BUTTON.COPIED();
          setTimeout(() => { buttonEl.textContent = originalText; }, 2000);
        },
      },
    ],
  });
}

const Status = {
  PENDING: "pending",
  CHECKING: "checking",
  LATEST: "latest",
  OUTDATED: "outdated",
  SKIPPED: "skipped",
  FAILED: "failed",
};

let hasChecked = false;
let isChecking = false;

const queue = new Queue({ autostart: true, concurrency: 6 });
queue.addEventListener("error", (event) => {
  console.error(event.detail.error);
  showModal(LL.ERROR.UNKNOWN());
});

const observer = new MutationObserver((records) => {
  console.log(records);
  init();
});

observer.observe(document.getElementById("library-grid"), { childList: true });

init();

function init() {
  hasChecked = false;

  const books = Array.from(document.querySelectorAll(".item-wrapper.book"));
  for (const book of books) {
    const actions = book.querySelector(
      ".item-info + .item-bar .library-actions-list",
    );

    const actionContainer = document.createElement("li");
    actionContainer.classList.add("library-actions-list-item");

    const action = document.createElement("button");
    action.classList.add("library-action");
    action.textContent = LL.BUTTON.CHECK_SINGLE();
    action.addEventListener("click", () => checkUpdate(book));

    actionContainer.appendChild(action);
    actions.appendChild(actionContainer);
  }

  const secondaryControls = document.querySelector(".secondary-controls");

  const updateContainer = document.createElement("div");
  updateContainer.classList.add("update-container");

  const updateControls = document.createElement("div");
  updateControls.classList.add("update-controls");

  const checkButton = document.createElement("button");
  checkButton.classList.add("update-button");
  checkButton.textContent = LL.BUTTON.CHECK_PAGE();
  checkButton.addEventListener("click", () => checkUpdateForBooks(books));

  const viewResultButton = document.createElement("button");
  viewResultButton.classList.add("update-button");
  viewResultButton.textContent = LL.BUTTON.VIEW_RESULT();
  viewResultButton.disabled = true;
  viewResultButton.addEventListener("click", () => {
    showResultModal(books);
  });

  updateControls.append(checkButton, viewResultButton);
  updateContainer.appendChild(updateControls);
  secondaryControls.insertBefore(updateContainer, secondaryControls.firstChild);

  function checkUpdateForBooks(books) {
    if (isChecking) return;

    if (hasChecked) {
      showConfirmModal(LL.MESSAGE.CONFIRM_RECHECK(), () => {
        doCheck(books);
      });
      return;
    }

    doCheck(books);
  }

  function doCheck(books) {
    isChecking = true;
    hasChecked = true;
    checkButton.disabled = true;
    checkButton.textContent = LL.BUTTON.CHECKING_PAGE();

    queue.addEventListener(
      "end",
      () => {
        isChecking = false;
        checkButton.disabled = false;
        checkButton.textContent = LL.BUTTON.CHECK_PAGE();
        viewResultButton.disabled = false;

        showResultModal(books);
      },
      { once: true },
    );

    books.forEach(checkUpdate);
  }
}

function getBookTitle(book) {
  return book.querySelector(".product-field.title").innerText;
}

function getCurrentProductId(book) {
  const config = JSON.parse(
    book.querySelector(
      ".library-action:is(.mark-as-finished, .remove-from-archive)",
    ).dataset.koboGizmoConfig,
  );
  return config.productId;
}

function getStorePageUrl(book) {
  const titleUrl = book.querySelector(".product-field.title a").href;
  if (titleUrl.startsWith("https://www.kobo.com/")) {
    return titleUrl;
  }

  const config = JSON.parse(
    book.querySelector(
      ".library-action:is(.mark-as-finished, .remove-from-archive)",
    ).dataset.koboGizmoConfig,
  );
  const imageUrl = config.imageUrl;
  const productCode = imageUrl.substring(
    imageUrl.lastIndexOf("/") + 1,
    imageUrl.lastIndexOf("."),
  );
  return `${location.href.substring(0, location.href.indexOf("/library"))}/ebook/${productCode}`;
}

async function getLatestProductId(book) {
  const response = await fetch(getStorePageUrl(book), {
    credentials: "same-origin",
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(LL.ERROR.UNLISTED());
    }

    throw new Error(LL.ERROR.UNKNOWN());
  }

  const html = await response.text();
  const parser = new DOMParser();
  const page = parser.parseFromString(html, "text/html");

  const itemId = page.querySelector("#ratItemId");
  if (itemId) {
    return itemId.value;
  }

  const config = page.querySelector(".item-detail");
  if (config) {
    return JSON.parse(config.dataset.koboGizmoConfig).productId;
  }

  throw new Error(LL.ERROR.PARSING());
}

function checkUpdate(book) {
  const message = book.querySelector(".product-field.item-status");

  book.dataset.checkStatus = Status.PENDING;
  message.replaceChildren(LL.STATUS.PENDING());

  queue.push(async () => {
    book.dataset.checkStatus = Status.CHECKING;
    message.textContent = LL.STATUS.CHECKING();

    if (book.dataset.koboGizmo === "PreviewLibraryItem") {
      book.dataset.checkStatus = Status.SKIPPED;

      message.classList.remove("buy-now");
      message.replaceChildren(LL.STATUS.PREVIEW());
      return;
    }

    try {
      const currentId = getCurrentProductId(book);
      const latestId = await getLatestProductId(book);
      console.debug(
        `${getBookTitle(book)}\n  Current: ${currentId}\n  Latest : ${latestId}`,
      );

      if (currentId === latestId) {
        book.dataset.checkStatus = Status.LATEST;
        message.replaceChildren(LL.STATUS.LATEST());
      } else {
        book.dataset.checkStatus = Status.OUTDATED;
        message.replaceChildren(LL.STATUS.OUTDATED());
      }
    } catch (e) {
      book.dataset.checkStatus = Status.FAILED;

      const link = document.createElement("a");
      link.textContent = LL.STATUS.FAILED();
      link.addEventListener("click", (event) => showModal(e.message));

      message.replaceChildren(link);

      // throw e;
    }
  });
}
