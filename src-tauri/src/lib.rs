use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use tauri::Manager;

// ── Geldrechner types ────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
struct Eintrag {
    datum: String,
    typ: String,
    betrag: f64,
    beschreibung: String,
    kategorie: String,
    wiederkehrend: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct WiederkehrendVorlage {
    typ: String,
    betrag: f64,
    beschreibung: String,
    kategorie: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct GeldEinstellungen {
    waehrung: String,
    budget_starttag: u32,
    kategorien: GeldKategorien,
}

#[derive(Serialize, Deserialize, Clone)]
struct GeldKategorien {
    #[serde(rename = "Einnahme")]
    einnahme: Vec<String>,
    #[serde(rename = "Ausgabe")]
    ausgabe: Vec<String>,
}

impl Default for GeldEinstellungen {
    fn default() -> Self {
        Self {
            waehrung: "CHF".into(),
            budget_starttag: 1,
            kategorien: GeldKategorien {
                einnahme: vec!["Gehalt","Freelance","Geschenk","Nebenjob","Sonstiges"].into_iter().map(String::from).collect(),
                ausgabe: vec!["Lebensmittel","Miete","Transport","Freizeit","Gesundheit","Kleidung","Abonnement","Sonstiges"].into_iter().map(String::from).collect(),
            },
        }
    }
}

#[derive(Serialize, Deserialize, Default)]
struct GeldData {
    eintraege: Vec<Eintrag>,
    budgets: HashMap<String, f64>,
    wiederkehrend: Vec<WiederkehrendVorlage>,
    wiederkehrend_monate: Vec<String>,
    einstellungen: GeldEinstellungen,
}

fn geld_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    app.path()
        .app_local_data_dir()
        .expect("no app local data dir")
        .join("sekai")
        .join("geld_data.json")
}

#[tauri::command]
fn load_geld_data(app: tauri::AppHandle) -> GeldData {
    let path = geld_path(&app);
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        GeldData { einstellungen: GeldEinstellungen::default(), ..Default::default() }
    }
}

#[tauri::command]
fn save_geld_data(app: tauri::AppHandle, data: GeldData) -> Result<(), String> {
    let path = geld_path(&app);
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_geld_csv(data: GeldData) -> String {
    let w = &data.einstellungen.waehrung;
    let mut rows = vec![format!("Datum;Typ;Kategorie;Betrag {w};Beschreibung")];
    for e in &data.eintraege {
        rows.push(format!("{};{};{};{:.2};{}", e.datum, e.typ, e.kategorie, e.betrag, e.beschreibung));
    }
    "\u{FEFF}".to_string() + &rows.join("\n")
}

#[derive(Serialize, Deserialize, Clone)]
struct Note {
    note: f64,
    gewicht: f64,
    semester: String,
    beschreibung: String,
}

#[derive(Serialize, Deserialize, Clone, Default)]
struct Fach {
    ziel: f64,
    noten: Vec<Note>,
}

#[derive(Serialize, Deserialize, Default)]
struct AppData {
    faecher: HashMap<String, Fach>,
}

fn data_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    app.path()
        .app_local_data_dir()
        .expect("no app local data dir")
        .join("sekai")
        .join("noten_data.json")
}

#[tauri::command]
fn load_data(app: tauri::AppHandle) -> AppData {
    let path = data_path(&app);
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        AppData::default()
    }
}

#[tauri::command]
fn save_data(app: tauri::AppHandle, data: AppData) -> Result<(), String> {
    let path = data_path(&app);
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

fn calc_weighted_avg(noten: &[Note]) -> Option<f64> {
    if noten.is_empty() {
        return None;
    }
    let tw: f64 = noten.iter().map(|n| n.gewicht).sum();
    if tw == 0.0 {
        return None;
    }
    Some(noten.iter().map(|n| n.note * n.gewicht).sum::<f64>() / tw)
}

#[tauri::command]
fn export_csv(data: AppData) -> String {
    let mut rows = vec![
        "Fach;Wunschnote;Aktueller Schnitt;Note;Gewicht;Semester;Beschreibung".to_string(),
    ];
    for (name, fach) in &data.faecher {
        let avg_str = calc_weighted_avg(&fach.noten)
            .map(|a| format!("{:.2}", a))
            .unwrap_or_default();
        for n in &fach.noten {
            rows.push(format!(
                "{};{};{};{};{};{};{}",
                name, fach.ziel, avg_str, n.note, n.gewicht, n.semester, n.beschreibung
            ));
        }
    }
    "\u{FEFF}".to_string() + &rows.join("\n")
}

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri_plugin_updater::UpdaterExt;
    match app.updater() {
        Ok(updater) => match updater.check().await {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(e.to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update.download_and_install(|_, _| {}, || {}).await.map_err(|e| e.to_string())?;
        app.restart();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            load_data, save_data, export_csv,
            load_geld_data, save_geld_data, export_geld_csv,
            check_for_updates, install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn n(note: f64, gewicht: f64) -> Note {
        Note {
            note,
            gewicht,
            semester: "S1".into(),
            beschreibung: String::new(),
        }
    }

    #[test]
    fn avg_empty_returns_none() {
        assert_eq!(calc_weighted_avg(&[]), None);
    }

    #[test]
    fn avg_zero_weight_returns_none() {
        assert_eq!(calc_weighted_avg(&[n(5.0, 0.0)]), None);
    }

    #[test]
    fn avg_equal_weights() {
        let result = calc_weighted_avg(&[n(5.0, 1.0), n(4.0, 1.0)]).unwrap();
        assert!((result - 4.5).abs() < f64::EPSILON);
    }

    #[test]
    fn avg_unequal_weights() {
        // 6.0*2 + 4.0*1 = 16 / 3 ≈ 5.333
        let result = calc_weighted_avg(&[n(6.0, 2.0), n(4.0, 1.0)]).unwrap();
        assert!((result - 16.0 / 3.0).abs() < f64::EPSILON);
    }

    #[test]
    fn csv_has_bom() {
        let csv = export_csv(AppData::default());
        assert!(csv.starts_with('\u{FEFF}'));
    }

    #[test]
    fn csv_has_header() {
        let csv = export_csv(AppData::default());
        assert!(csv.contains("Fach;Wunschnote"));
    }
}
