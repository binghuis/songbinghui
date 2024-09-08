import Giscus, { type Theme } from "@giscus/react";
import React from "react";

const id = "binghuis";

const htmlElement = document.documentElement;

function getTheme(): Theme {
  return htmlElement.getAttribute("data-theme") || "light";
}

const DefaultTheme: Theme = getTheme();

export default function Comments() {
  const [theme, setTheme] = React.useState<Theme>(DefaultTheme);

  React.useEffect(() => {
    const observer = new MutationObserver(mutationsList => {
      const html = mutationsList.filter(
        mutation =>
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
      )[0];
      if (html) {
        setTheme(getTheme());
      }
    });

    observer.observe(htmlElement, { attributes: true });
  }, []);

  return (
    <div>
      <Giscus
        id={id}
        repo="binghuis/blog"
        repoId="R_kgDOMsge8Q"
        category="Announcements"
        categoryId="DIC_kwDOMsge8c4CiTTf"
        mapping="title"
        term="Welcome to Binghui's blog!"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
