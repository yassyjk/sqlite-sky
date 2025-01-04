import React, { useState } from 'react';
import { AtpAgent, RichText } from "@atproto/api";
import "../../App.css";
import "./PostForm.css";

interface IPostFormProps {
    username: string;
    password: string;
}

const PostForm: React.FunctionComponent<IPostFormProps> = ({ username, password }) => {
    const [postContent, setPostContent] = useState("");
    const [postResult, setPostResult] = useState<string | null>(null);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();

        const agent = new AtpAgent({ service: "https://bsky.social" });

        try {
            // ログイン処理
            await agent.login({ identifier: username + ".bsky.social", password });

            const rt = new RichText({
                text: postContent
            });

            // リンクやメンションの検出
            await rt.detectFacets(agent);

            // 投稿処理
            await agent.post({
                text: rt.text,
                facets: rt.facets,
            });

            setPostResult("投稿に成功しました。");
            setPostContent("");
        } catch (error) {
            setPostResult(`投稿エラー: ${error}`);
        }
    };
    
    return (
        <div>
            <h2>投稿フォーム</h2>
            <p>次に投稿内容を入力</p>
            {postResult &&
                <p>{ postResult }</p>
            }
            <form onSubmit={handlePost} className="post-form">
                <textarea 
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    required>    
                </textarea>
                <br></br>
                <button type="submit">投稿</button>
            </form>
        </div>
    );

};

export default PostForm;
