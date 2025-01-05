// use tauri::Manager;
// use reqwest::Client;
use tauri_plugin_http::reqwest;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use image;

#[derive(Debug, Serialize, Deserialize)]
pub struct OgData{
    title: Option<String>,
    description: Option<String>,
    image: Option<String>,
    url: Option<String>,
}

#[tauri::command]
pub async fn fetch_og(url: String) -> Result<OgData, String> {
    // let client = reqwest::new();
    let res = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    
    // println!("reqwest: {:#?}", &res);

    let body = res.text().await.map_err(|e| e.to_string())?;
    
    // println!("body: {:#?}", &body);

    let document = Html::parse_document(&body);
    let selector = Selector::parse("meta[property^='og:']").unwrap();

    let mut og_data = OgData{
        title: None,
        description: None,
        image: None,
        url: None,
    };

    for element in document.select(&selector){
        let property = element.value().attr("property").unwrap_or("");
        let content = element.value().attr("content").unwrap_or("");

        match property {
            "og:title" => og_data.title = Some(content.to_string()),
            "og:description" => og_data.description = Some(content.to_string()),
            "og:image" => og_data.image = Some(content.to_string()),
            "og:url" => og_data.url = Some(content.to_string()),
            _ => {}
        }
    }

    
    // println!("data: {:#?}", &og_data);

    Ok(og_data)
}

#[tauri::command]
pub async fn compress_image(image_data: Vec<u8>, width: u32, quality: u8) -> Result<Vec<u8>, String> {
    println!("幅: {:#?}", width);
    println!("画像フォーマット: {:#?}", image_data);


    // データが空でないことを確認
    if image_data.is_empty(){
        return Err("画像データが空です。".to_string());
    }

    println!("画像フォーマット: {:#?}", image_data);

    // フォーマットを確認
    let aaa = image::guess_format(&image_data)
    .map_err(|e| format!("画像フォーマットが不明： {}", e))?;

    println!("画像フォーマット: {:#?}", aaa);


    // デコード
    let img = image::load_from_memory(&image_data)
    .map_err(|e| format!("画像のデコードに失敗: {}", e))?;

    // リサイズ
    let resized = img.resize(width, width, image::imageops::FilterType::Lanczos3);

    // JPEG圧縮
    let mut buffer = Vec::new();
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, quality);
    encoder.encode_image(&resized)
    .map_err(|e| format!("画像のエンコードに失敗 {}", e))?;

    Ok(buffer)
}
