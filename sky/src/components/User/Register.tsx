import React, { useState, useEffect } from 'react';
import "../../App.css";
import "./Register.css";
import { Client, Stronghold } from '@tauri-apps/plugin-stronghold';
import { invoke } from "@tauri-apps/api/core";


interface IPostFormProps {
    initStronghold: () => Promise<void>;
    getRegister: (client: Client) => Promise<void>;
    username: string;
    password: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    stronghold: Stronghold | null;
    client: any;
}

const Register: React.FunctionComponent<IPostFormProps> = ({ initStronghold, getRegister, username, password, setUsername, setPassword, stronghold, client }) => {
    const [registerResult, setRegisterResult] = useState<string | null>(null);

    const handleRegister = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!stronghold || !client) {
            setRegisterResult("strongholdが初期化されていません。")
            await initStronghold();
        }

        try {
            // const hashPassword = await invoke<string>("hash_password", { password });
            const encodedUsername = Array.from(new TextEncoder().encode(username));
            const encodedPassword = Array.from(new TextEncoder().encode(password));

            const store = client.getStore();
            
            await store.insert("username", encodedUsername);
            await store.insert("app-password", encodedPassword);
            await stronghold.save();
            getRegister(client);

            setUsername(username);
            setRegisterResult("strongholdにユーザー登録しました。")

            // sqliteに保存する処理
            const result = await invoke("signup_user", {
                username: username,
                app_pass: password
            });
            console.log(result);

            localStorage.setItem("currentUser", username);

            setRegisterResult("sqliteとlocalstorageにユーザー名を登録しました。")
        } catch (error) {
            setRegisterResult(`登録エラー: ${error}`);
        }
    };

    useEffect(() => {
        initStronghold();
    }, []);
    
    return (
        <form onSubmit={handleRegister} >
            
            {registerResult && 
                <p>{ registerResult }</p>
            }
            
            <div className="user-info">
                <label htmlFor="username">ユーザー名</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required />.bsky.social
                <br></br>

                <label htmlFor="password">パスワード</label>
                <input
                    type="text"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required />
            </div>
            <br></br>
            <button type="submit">ユーザー登録</button>
        </form>
    );

};

export default Register;
