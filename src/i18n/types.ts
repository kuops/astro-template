export interface UIStrings {
  reading: {
    metadata: string;
  };
  language: {
    switchLanguage: string;
    names: {
      zh: string;
      en: string;
    };
    sourceLabel: string;
    readIn: string;
  };
  nav: {
    home: string;
    posts: string;
    tags: string;
    about: string;
    archives: string;
    search: string;
    books: string;
  };
  post: {
    updatedAt: string;
    sharePostIntro: string;
    sharePostOn: string;
    sharePostViaEmail: string;
    backToTop: string;
    goBack: string;
    editPage: string;
    previousPost: string;
    nextPost: string;
    copyCode: string;
    copied: string;
  };
  pagination: {
    page: string;
  };
  home: {
    socialLinks: string;
    featured: string;
    recentPosts: string;
    allPosts: string;
    statsPosts: string;
    statsBooks: string;
    statsTags: string;
    browseBooks: string;
    welcomeHumidity: string;
    welcomeWind: string;
    welcomeRange: string;
    welcomeLoading: string;
    welcomeFallback: string;
    weatherObserved: string;
  };
  footer: {
    copyright: string;
    allRightsReserved: string;
  };
  pages: {
    tagTitle: string;
    /** 标签页标题里「标签」和标签名之间的连接符（中文全角冒号，英文冒号加空格） */
    tagTitleSep: string;
    /** 标签页描述，{{count}} 为该标签下的文章总数 */
    tagDesc: string;
    /** 标签下只有 1 篇文章时的描述。给需要区分单复数的语言用，不填则用 tagDesc */
    tagDescOne?: string;
    tagsTitle: string;
    tagsDesc: string;
    postsTitle: string;
    postsDesc: string;
    archivesTitle: string;
    archivesDesc: string;
    searchTitle: string;
    toc: string;
    openToc: string;
    closeToc: string;
    searchHintBefore: string;
    searchHintAfter: string;
    searchHintMobile: string;
  };
  a11y: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    toggleTheme: string;
    searchPlaceholder: string;
    noResults: string;
    goToPreviousPage: string;
    goToNextPage: string;
    goToPage: string;
    searchUnavailable: string;
    searchHintNavigate: string;
    searchHintOpen: string;
    searchHintClose: string;
    clearSearch: string;
    headingAnchor: string;
  };
  notFound: {
    title: string;
    message: string;
    goHome: string;
  };
  book: {
    previousChapter: string;
    nextChapter: string;
    tableOfContents: string;
    chapterNav: string;
    backToBooks: string;
    openChapterNav: string;
    closeChapterNav: string;
    chapters: string;
    onThisPage: string;
    chapterProgress: string;
    startReading: string;
  };
  booksPage: {
    title: string;
    description: string;
  };
  mermaid: {
    preview: string;
    source: string;
    copySource: string;
    fullscreen: string;
    close: string;
  };
}
