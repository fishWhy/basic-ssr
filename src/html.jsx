import React, {Suspense, use} from 'react';

function CommentsScript({comments: commentsPromise}) {
  const comments = use(commentsPromise);
  return <script dangerouslySetInnerHTML={{
    __html: `window.__setComments_data(${JSON.stringify(comments)})`
  }}></script>
}

export default ({children,comments}) => {
  return <html>
    <head>
      <link ref="stylesheet" href="/index.css"></link>
      <meta charSet="utf-8" />
    </head>
    <body>
      <div id='root'>{children}</div>
      <script src="/index.js" />
      <Suspense>
        <CommentsScript comments={comments}></CommentsScript>
      </Suspense>
    </body>
  </html>
}
