import React, { useRef, use, Suspense } from "react";

function Comments({comments}) {
  const commentsResult = use(comments);
  return Array.isArray(commentsResult) && commentsResult.map(comment => {
    return  <p key={comment}>{comment}</p>;
  })
}

export default function Index({comments}) {

  const inputRef = useRef(null)

  const onSubmit = () => {
    if(inputRef.current) {
      alert(`添加评论内容:${inputRef.current?.value}`)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
      <div>
        <div>商品</div>
        <p>价格</p>
        <input ref={inputRef} />
        <button onClick={onSubmit}>添加评论</button>
        <div>
          <div>
            <p>评论</p>
            <Suspense fallback={<div>Loading...</div>}>
              <Comments comments={comments} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
