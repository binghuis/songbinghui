import Giscus from "@giscus/react";

export default function Comments() {
  return (
    <div>
      <Giscus
        id="comments"
        repo="binghuis/blog"
        repoId="R_kgDOMsge8Q"
        category="Announcements"
        categoryId="DIC_kwDOMsge8c4CiTTf"
        mapping="title"
        term="Welcome to Binghui's blog!"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="preferred_color_scheme"
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
