import React, { useEffect, useState, useRef } from 'react';
import { AtpAgent } from "@atproto/api";
import "../../App.css";
import "./MyPostlist.css";


interface IMyPostlistProps {
    username: string;
    password: string;
}

interface Post{
    uri: string;
    text: string;
    createdAt: string;
}


const MyPostlist: React.FunctionComponent<IMyPostlistProps> = ({username, password}) => {
    // const [username, setUsername] = useState<string>("");
    // const [password, setPassword] = useState<string>("");
    const [postContent, setPostContent] = useState<Post[]>([]);
    const [fetchResult, setFetchResult] = useState<string | null>(null);
    
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const agent = new AtpAgent({ service: "https://bsky.social" });

    const fetchMyPost = async () => {
        try {
            // ログイン処理
            // console.log(username);
            // console.log(password);

            if (username && password) {
                await agent.login({ identifier: username + ".bsky.social", password });

                // 投稿一覧取得
                const response = await agent.getAuthorFeed({
                    actor: `${username}.bsky.social`,
                    limit: 10,
                })

                if (response.success) {
                    const data: Post[] = response.data.feed.map((item) => ({
                        uri: item.post.uri,
                        text: (item.post.record as { text: string }).text,
                        createdAt: (item.post.record as { createdAt: string }).createdAt,
                    }))
                    setPostContent(data);
                    setFetchResult("投稿一覧を取得しました。");  
                }
              
            } else {
                const response = await agent.getAuthorFeed({
                    actor: `${username}.bsky.social`,
                    limit: 10
                })
                setFetchResult("ユーザー情報がありません。" + username + ":" + password + ":" + response);
            }
        } catch (error) {
            setPostContent([]);
            setFetchResult("fetch error:" + error);
        }
    }

    useEffect(() => {
        if (username || password) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                fetchMyPost();
            }, 1000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [username, password]);

    // const getCredentials = () => {
    //     const localUsername = localStorage.getItem("username") as string;
    //     const localPassword = localStorage.getItem("app-password") as string;
    //     if (!username || !password) {
    //         setUsername(localUsername);
    //         setPassword(localPassword);
    //     }
    // }

    // const saveCredentials = (username: string, password: string) => {
    //     localStorage.setItem("username", username);
    //     localStorage.setItem("app-password", password);
    // }

    // const fetchMyPost = async (e: React.FormEvent) => {
    //     e.preventDefault();

    //     const agent = new AtpAgent({ service: "https://bsky.social" });

    //     try {
    //         // ログイン処理
    //         const account = await agent.login({ identifier: username + ".bsky.social", password });

    //         // 投稿処理
    //         const response = await agent.post({
    //             text: postContent
    //         });

    //         setResult(`投稿に成功しました。:${account}:${JSON.stringify(response)}`);
    //         setPostContent("");
    //     } catch (error) {
    //         setResult(`投稿エラー: ${error}`);
    //     }
    // };
    
    return (
        <div>
            <h2>マイ投稿一覧</h2>
            {fetchResult && <p>{fetchResult}</p>}
            {postContent.length === 0 ? (
                <p>投稿無し</p>
            ) : (<ul role='list'>
                    {
                        postContent.map((post) => (
                            <div>
                                <hr></hr>
                                <li key={post.uri} className='post-list'>
                                    <p>{post.text}</p>
                                    <p>{new Date(post.createdAt).toLocaleString()}</p>
                                </li>
                            </div>
                        ))
                    }
            </ul>
            )   
            }
        </div>
    );

};

export default MyPostlist;
