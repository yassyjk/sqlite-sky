import React, { useState } from 'react';
import { AtpAgent, RichText } from "@atproto/api";
import "../../App.css";
import "./PostForm.css";
import "process";

// import ogs from 'open-graph-scraper';
// import sharp from 'sharp';

import { invoke } from "@tauri-apps/api/core";

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

            // textからURLを取得
            const findUrlInText = async (rt: RichText): Promise<string | null> => {
                if (rt.facets == undefined) return null;
                if (rt.facets.length < 1) return null;
                for (const facet of rt.facets) {
                    if (facet.features.length < 1) continue;
                    for (const feature of facet.features) {
                        if (feature.$type != "app.bsky.richtext.facet#link") continue;
                        else if (feature.uri == null) continue;
                        return feature.uri as string;
                    }
                }
                return null;
            };

            // const fetchOgData = async (url: string) => {
            //     try {
            //         const ogData = await invoke("fetch_og", { url });
            //         console.log("OG Data:", ogData);
            //     } catch (error) {
            //         console.error("OGデータ取得エラー");
            //     }
            // }
            // urlからOGP情報を取得
            type OgInfo = {
                siteUrl: string;
                ogImageUrl: string;
                type: string;
                description: string;
                title: string;
                imageData: Uint8Array;
            };

            const getOgInfo = async (url: string): Promise<OgInfo> => {
                try {
                    const ogData: any = await invoke("fetch_og", { url });

                    if (ogData) {
                        if (ogData.image) {
                            
                            // console.log(ogData.image);
                            const imageResponse = await invoke("fetch_image", {imageUrl: ogData.image});
                            const imageBuffer = new Uint8Array(imageResponse as number[]);

                            // console.log(imageBuffer);

                            // sharpを使って画像縮小
                            // const compressedImage = await sharp(imageBuffer)
                            //     .resize(400, null, { fit: "inside", withoutEnlargement: true })
                            //     .jpeg({ quality: 80, progressive: true })
                            //     .toBuffer();

                            const compressedImage = await invoke("compress_image", {
                                imageData: Array.from(new Uint8Array(imageBuffer)),
                                width: 400,
                                quality: 80
                            });
                            
                            // OgInfoを返す
                            return {
                                siteUrl: url,
                                ogImageUrl: ogData.url || "",
                                type: "image/jpeg",
                                description: ogData.description || "",
                                title: ogData.title || "",
                                imageData: new Uint8Array(compressedImage as number[]),
                            }
                        } else {
                            return {
                                siteUrl: url,
                                ogImageUrl: "",
                                type: "",
                                description: ogData.description || "",
                                title: ogData.title || "",
                                imageData: new Uint8Array(),
                            };
                        }

                    } else {
                        throw new Error("failed to get ogImage");
                    }
                } catch (error) {
                    console.error("OGデータ取得エラー:", error);
                    throw new Error("failed to get ogImage:" + error);
                }
            };
                // // open-graph-scraperでogp情報を取得
                // const { result } = await ogs({ url: url });

                // if (!result.success) {
                //     throw new Error("Failed to get ogp info");
                // };

                // // if (result.ogImage && Array.isArray(result.ogImage)) {
                // //     const ogImage = result.ogImage[0];

                // //     // fetchで画像取得
                // //     const res = await fetch(ogImage.url || "");
                // //     const buffer = await res.arrayBuffer();

                // //     // sharpを使って画像縮小
                // //     const compressedImage = await sharp(buffer)
                // //         .resize(400, null, { fit: "inside", withoutEnlargement: true })
                // //         .jpeg({ quality: 80, progressive: true })
                // //         .toBuffer();
                    
                // //     // OgInfoを返す
                // //     return {
                // //         siteUrl: url,
                // //         ogImageUrl: ogImage.url || "",
                // //         type: ogImage.type || "",
                // //         description: result.ogDescription || "",
                // //         title: result.ogTitle || "",
                // //         imageData: new Uint8Array(compressedImage),
                //     }
                // } else {
                //     throw new Error("failed to get ogImage");
                // }
            

            type UnPromise<T> = T extends Promise<infer R> ? R : never;
            type UploadImageResponse = UnPromise<ReturnType<AtpAgent["uploadBlob"]>>;

            const uploadImage = async (ogInfo: OgInfo): Promise<UploadImageResponse> => {
                return await agent.uploadBlob(ogInfo.imageData, {
                    encoding: "image/jpeg",
                });
            }

            // テキストからURL取得
            const url = await findUrlInText(rt);

            if (url) {
                // URLからOGP取得
                const ogInfo = await getOgInfo(url);
                // 画像アップロード
                const uploadedRes = await uploadImage(ogInfo);

                const embed = {
                    $type: "app.bsky.embed.external",
                    external: {
                        uri: ogInfo.siteUrl,
                        thumb: {
                            $type: "blob",
                            ref: {
                                $link: uploadedRes.data.blob.ref.toString(),
                            },
                            mimeType: uploadedRes.data.blob.mimeType,
                            size: uploadedRes.data.blob.size,
                        },
                        title: ogInfo.title,
                        description: ogInfo.description,
                    },
                };

                // url付き投稿処理
                await agent.post({
                    text: rt.text,
                    facets: rt.facets,
                    embed: embed || undefined,
                });
            } else {
                // url付無し投稿処理
                await agent.post({
                    text: rt.text,
                    facets: rt.facets,
                });
            }

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
