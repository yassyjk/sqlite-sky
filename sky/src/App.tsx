// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import PostForm from "./components/Form/PostForm";
import "./App.css";
import Register from "./components/User/Register"; 

import React, { useState, useEffect } from 'react';
// import { Client, Stronghold } from '@tauri-apps/plugin-stronghold';
// import { appDataDir } from '@tauri-apps/api/path';
import MyPostlist from "./components/Data/MyPostlist";
import UserList from "./components/User/UserList";
// import { invoke } from "@tauri-apps/api/core";

// import { getCurrentWindow } from "@tauri-apps/api/window";
// import { confirm } from "@tauri-apps/plugin-dialog";


const App: React.FC = () => {
  const [users, setUsers] = useState<string[]>([]);
      const [username, setUsername] = useState("");
      const [password, setPassword] = useState("");
      // const [strongholdResult, setStrongholdResult] = useState<string | null>(null);
      const [result, setResult] = useState<string | null>(null);
      // const [stronghold, setStronghold] = useState<Stronghold | null>(null);
      // const [client, setClient] = useState<Client | null>(null);

  const fetchUsers = async () => {
    try {
      const userList: string[] = await invoke("get_users");
      setUsers(userList);
    } catch (error) {
      setResult("ユーザー一覧の取得に失敗");
    }
  };

  const switchUser = async (newUser: string) => {
    localStorage.setItem("currentUser", newUser);
    
    const currentUser = localStorage.getItem("currentUser");

    if (currentUser) {
      const sqlite_password: string = await invoke("login_user", {
        username: currentUser
      })
      if (sqlite_password) {
        setUsername(currentUser);
        setPassword(sqlite_password);
      }
      setResult("sqliteからユーザーを読み込みました。");
    } else {
      setResult("ユーザー登録をしてください。");
    }
  };
      

  // const initStronghold = async () => {
  //       setStrongholdResult("データ取得中..");
  //       try {
  //             const vaultPath = `${await appDataDir()}/vault.hold`;
  //             const strongholdPassword = "tauri-sky";

  //             const newStronghold = await Stronghold.load(vaultPath, strongholdPassword);

  //             let strongholdClient: Client;

  //             const clientName = "main-client-name";
  //             try{
  //                 strongholdClient = await newStronghold.loadClient(clientName);
  //             }catch{
  //                 strongholdClient = await newStronghold.createClient(clientName);
  //             }

  //             await setStronghold(newStronghold);
  //             await setClient(strongholdClient);

  //             // 明示的にsave
  //             await newStronghold.save();
          
  //             getRegister(strongholdClient);
  //             setStrongholdResult("");
  //         } catch (error) {
  //             console.error("Stronghold error:" + error);
  //             setStrongholdResult("データ初期化エラー:" + error);
  //         }
  // }
  
  // const setupCloseListener = async () => {
  //   const unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
  //     if (stronghold) {
  //       try {
  //         await stronghold.save();
  //         console.log("save success")
  //       } catch (error) {
  //         alert("save error:" + error);
  //         event.preventDefault();
  //         return;
  //       }
  //     }

  //     getCurrentWindow().close;

      // const confirmed = await confirm("終了しますか？");
      // if (!confirmed) {
      //   event.preventDefault();
      //   return;
      // }
    // });
    
  //   return () => {
  //       unlisten();
  //   };
    
  // };
  

  const getRegister = async () => {
      try {
        // const store = client.getStore();
        
        // const encodedUsername = await store?.get("username");
        // const encodedPassword = await store?.get("app-password");

        // if (encodedUsername && encodedPassword) {
        //   const decodedUsername = new TextDecoder().decode(new Uint8Array(encodedUsername));
        //   const decodedPassword = new TextDecoder().decode(new Uint8Array(encodedPassword));
        //   setUsername(decodedUsername);
        //   setPassword(decodedPassword);
          
        //   setResult("既存のユーザーを読み込みました。");
        // }

        //   if (username == "") {
            try {
              const currentUser = localStorage.getItem("currentUser");

              if (currentUser) {
                const sqlite_password: string = await invoke("login_user", {
                  username: currentUser
                })
                if (sqlite_password) {
                  setUsername(currentUser);
                  setPassword(sqlite_password);
                }
                setResult("sqliteからユーザーを読み込みました。");
              } else {
                setResult("ユーザー登録をしてください。");
              }
              
            } catch (error) {
              setResult("ユーザー登録をしてください。");
            }
          // }
        
          // setResult("ユーザー登録がされていません。");
        
          
      }catch(error){
          setResult("ユーザー読み込みエラー" + error);
      }
  }

      
      // const { stronghold, client } = initStronghold();

      // const store = client.getStore();

  useEffect(() => {
    const setup = async () => {
      // await setupCloseListener();
      // await initStronghold();
      await getRegister();
      await fetchUsers();
    };
    setup();
  }, []);
      

    return (
      <main className="container">
        <h1>Tauri-Sky</h1>
        
        {result && 
          <p>R: {result}</p>
        }
        <UserList users={users} currentUser={username} switchUser={switchUser} />
        <Register getRegister={getRegister} username={username} password={password} setUsername={setUsername} setPassword={setPassword}  />
        <PostForm username={username} password={password} />
        <MyPostlist username={username} password={password} />
      </main>
    );
}

export default App;
