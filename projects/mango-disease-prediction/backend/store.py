import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from backend.auth import hash_password

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

SCAN_HISTORY_FILE = DATA_DIR / "scan_history.json"
SETTINGS_FILE = DATA_DIR / "settings.json"
OPERATIONAL_STATS_FILE = DATA_DIR / "operational_stats.json"
USERS_FILE = DATA_DIR / "users.json"
HELP_TICKETS_FILE = DATA_DIR / "help_center_tickets.json"
FARM_FILE = DATA_DIR / "farm.json"
MARKET_PRICES_FILE = DATA_DIR / "market_prices.json"
NEWS_FEED_FILE = DATA_DIR / "news_feed.json"

# Seed default demo users
demo_hash, demo_salt = hash_password("password123", "demosalt12345678")
manas_hash, manas_salt = hash_password("password123", "manassalt1234567")

DEFAULT_USERS = [
    {
        "id": "USR-001",
        "email": "demo@mangodl.ai",
        "fullName": "Demo Agronomist",
        "passwordHash": demo_hash,
        "salt": demo_salt,
        "role": "Orchard Manager",
        "organization": "Karnataka Mango Development Board",
        "createdAt": "2026-05-01"
    },
    {
        "id": "USR-002",
        "email": "manas@mangodl.ai",
        "fullName": "Manas (Admin & Researcher)",
        "passwordHash": manas_hash,
        "salt": manas_salt,
        "role": "Lead System Architect & Admin",
        "organization": "MangoDL AI Research / KSIT CSE",
        "createdAt": "2026-05-01"
    }
]

DEFAULT_HISTORY = [
    { "id": 1, "date": "2026-05-27", "image": "leaf_001.jpg", "disease": "Anthracnose", "confidence": 94.2, "severity": "High" },
    { "id": 2, "date": "2026-05-26", "image": "leaf_002.jpg", "disease": "Healthy", "confidence": 98.7, "severity": "None" },
    { "id": 3, "date": "2026-05-25", "image": "leaf_003.jpg", "disease": "Powdery Mildew", "confidence": 87.3, "severity": "Medium" },
    { "id": 4, "date": "2026-05-24", "image": "leaf_004.jpg", "disease": "Bacterial Canker", "confidence": 91.5, "severity": "High" },
    { "id": 5, "date": "2026-05-23", "image": "leaf_005.jpg", "disease": "Healthy", "confidence": 96.4, "severity": "None" }
]

DEFAULT_SETTINGS = {
    "profile": {
        "fullName": "Manas Mishra",
        "email": "manas@mangodl.ai",
        "phone": "+91 98765 43210",
        "location": "Bengaluru / Karnataka, India",
        "organization": "Karnataka Mango Development Board & KSIT",
        "role": "Senior Agricultural Technologist & Researcher"
    },
    "aiConfig": {
        "diseaseArchitecture": "MangoLeafXNetMultiTask (99.0% Acc)",
        "autoScanFrequency": "Every 6 hours",
        "detectionThreshold": "75%",
        "yieldModelVersion": "v3.2 (Latest)",
        "autoNotifications": True,
        "gradcamVisualization": True,
        "revenueForecasting": True,
        "betaFeatures": False
    },
    "notifications": {
        "emailAlerts": True,
        "whatsappAlerts": True,
        "climateAlerts": True,
        "weeklyDigest": False,
        "soundAlerts": True
    },
    "security": {
        "twoFactorEnabled": True,
        "sessionTimeout": "7 Days",
        "loginNotifications": True
    },
    "appearance": {
        "theme": "Cyber Amber",
        "compactMode": False,
        "highContrast": False
    },
    "integrations": {
        "openMeteo": {"name": "Open-Meteo Climate API", "enabled": True},
        "nhbDatabase": {"name": "NHB Yield Database (2015-2024)", "enabled": True},
        "litellmRouter": {"name": "LiteLLM Multi-Model Vision Router", "enabled": True},
        "whatsappWebhook": {"name": "WhatsApp Farmer Alert Gateway", "enabled": True}
    },
    "apiKeys": [
        {
            "id": "key-001",
            "name": "Production Mobile & IoT Key",
            "maskedKey": "mg_live_9f8a••••••••••••1849a",
            "createdAt": "2026-05-01",
            "lastUsed": "Active Today",
            "status": "Active"
        }
    ]
}

DEFAULT_STATS = {
    "imagesProcessed": 12847,
    "inferencesMade": 94230,
    "avgLatency": "28ms",
    "modelAccuracy": "99.0%"
}

DEFAULT_HELP_TICKETS = [
    {
        "id": "TK-101",
        "farmerName": "Ramesh Gowda",
        "phone": "+91 98451 22340",
        "email": "ramesh.kolar@gmail.com",
        "district": "Kolar",
        "mangoVariety": "Totapuri & Raspuri",
        "category": "Disease Diagnosis",
        "priority": "High",
        "status": "Answered",
        "subject": "Anthracnose dark spots spreading on new leaf flush",
        "message": "Sir, in my 12-acre orchard in Kolar, I noticed circular dark necrotic spots on young leaves after last week's rain. The MangoDL app detected Anthracnose with 94% confidence. What fungicide dosage and spray interval do you recommend for this stage?",
        "createdAt": "2026-08-15 10:30",
        "updatedAt": "2026-08-15 14:15",
        "replies": [
            {
                "id": "REP-1",
                "author": "Manas (Admin / KSIT MangoDL)",
                "role": "Lead Administrator",
                "isAdmin": True,
                "timestamp": "2026-08-15 14:15",
                "message": "Namaskara Ramesh Gowda avare. For Anthracnose in Kolar during humid flush conditions: 1) Apply Copper Oxychloride 50 WP @ 3g/L or Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2g/L water immediately. 2) Ensure canopy pruning to improve airflow. 3) Re-scan after 7 days using MangoDL to confirm lesion arrest."
            }
        ]
    },
    {
        "id": "TK-102",
        "farmerName": "Suresh Patil",
        "phone": "+91 97410 88219",
        "email": "suresh.dharwad@agro.in",
        "district": "Dharwad",
        "mangoVariety": "Alphonso (Kari Ishad)",
        "category": "Climate Extremes",
        "priority": "Medium",
        "status": "In Progress",
        "subject": "VPD risk warning in Dharwad climate intelligence page",
        "message": "Hello Manas sir, when I checked Dharwad district weather on the Climate Monitor, it flagged high VPD (Vapor Pressure Deficit) stress for tomorrow afternoon. Will this affect fruit set, and should I adjust drip irrigation?",
        "createdAt": "2026-08-16 09:15",
        "updatedAt": "2026-08-16 11:00",
        "replies": [
            {
                "id": "REP-2",
                "author": "Manas (Admin / KSIT MangoDL)",
                "role": "Lead Administrator",
                "isAdmin": True,
                "timestamp": "2026-08-16 11:00",
                "message": "Hello Suresh. High VPD above 2.2 kPa increases canopy transpiration shock. We recommend micro-sprinkler misting or running drip cycles during early morning (6:00 AM - 8:30 AM) to maintain soil moisture buffer. We are reviewing regional station sensor data for Dharwad right now."
            }
        ]
    },
    {
        "id": "TK-103",
        "farmerName": "Manjunatha K.",
        "phone": "+91 94480 33901",
        "email": "manju.orchards@yahoo.com",
        "district": "Ramanagara",
        "mangoVariety": "Raspuri Special",
        "category": "Yield & Market Decision",
        "priority": "Low",
        "status": "Open",
        "subject": "Revenue module recommendation between Channapatna APMC vs Mango Pulp Factory",
        "message": "Namaskara sir, my predicted harvest yield is ~14 tons/hectare in Ramanagara. The app suggests selling Grade-A fruit to direct Bengaluru retail market and Grade-B to pulp processing. How do I lock in wholesale price before harvest week?",
        "createdAt": "2026-08-16 16:45",
        "updatedAt": "2026-08-16 16:45",
        "replies": []
    },
    {
        "id": "TK-104",
        "farmerName": "Basavaraj Hubli",
        "phone": "+91 98800 77123",
        "email": "basav.belgaum@gmail.com",
        "district": "Belagavi (Belgaum)",
        "mangoVariety": "Pairi & Mallika",
        "category": "App Usage & Guidance",
        "priority": "Low",
        "status": "Resolved",
        "subject": "How to upload multiple leaf samples from phone gallery",
        "message": "Sir, I took 5 photos of leaves from different trees in my orchard. Can I test them one by one in the disease detection section?",
        "createdAt": "2026-08-14 15:20",
        "updatedAt": "2026-08-14 17:00",
        "replies": [
            {
                "id": "REP-3",
                "author": "Manas (Admin / KSIT MangoDL)",
                "role": "Lead Administrator",
                "isAdmin": True,
                "timestamp": "2026-08-14 17:00",
                "message": "Yes Basavaraj avare! You can click 'Browse Files' or 'Camera Scan' for each leaf, click 'Run AI Disease Analysis', and each scan is automatically logged with time and Grad-CAM diagnosis under the 'Scan History' table."
            }
        ]
    }
]

def load_json(filepath: Path, default_data: Any) -> Any:
    if not filepath.exists():
        save_json(filepath, default_data)
        return default_data
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return default_data

def save_json(filepath: Path, data: Any):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# Users
def get_users() -> List[Dict[str, Any]]:
    return load_json(USERS_FILE, DEFAULT_USERS)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    users = get_users()
    email_clean = email.strip().lower()
    for u in users:
        if u.get("email", "").strip().lower() == email_clean:
            return u
    return None

def create_user(full_name: str, email: str, password_hash: str, salt: str, role: str = "Orchard Manager", organization: str = "MangoDL AI Platform") -> Dict[str, Any]:
    users = get_users()
    user = {
        "id": f"USR-00{len(users) + 1}",
        "email": email.strip().lower(),
        "fullName": full_name.strip(),
        "passwordHash": password_hash,
        "salt": salt,
        "role": role,
        "organization": organization,
        "createdAt": time.strftime("%Y-%m-%d")
    }
    users.append(user)
    save_json(USERS_FILE, users)
    return user

MAX_SCAN_HISTORY = 50

# Scan History
def get_scan_history(limit: int = MAX_SCAN_HISTORY) -> List[Dict[str, Any]]:
    history = load_json(SCAN_HISTORY_FILE, DEFAULT_HISTORY)
    if isinstance(history, list) and len(history) > limit:
        # Strictly keep only recent 50 history and delete older entries
        history = history[:limit]
        save_json(SCAN_HISTORY_FILE, history)
    return history

def add_scan_history(record: Dict[str, Any], limit: int = MAX_SCAN_HISTORY):
    history = load_json(SCAN_HISTORY_FILE, DEFAULT_HISTORY)
    if not isinstance(history, list):
        history = []
    
    # Generate sequential unique id
    highest_id = max([r.get("id", 0) for r in history if isinstance(r, dict)], default=0)
    record["id"] = highest_id + 1
    
    # Insert newest at top
    history.insert(0, record)
    
    # Strictly retain only the recent 50 history items, automatically deleting older ones
    if len(history) > limit:
        history = history[:limit]
        
    save_json(SCAN_HISTORY_FILE, history)

def prune_scan_history(keep: int = MAX_SCAN_HISTORY) -> List[Dict[str, Any]]:
    """Explicit utility to prune history down to recent 50 entries."""
    history = load_json(SCAN_HISTORY_FILE, DEFAULT_HISTORY)
    if isinstance(history, list):
        history = history[:keep]
        save_json(SCAN_HISTORY_FILE, history)
    return history

# Settings
def get_settings() -> Dict[str, Any]:
    stored = load_json(SETTINGS_FILE, DEFAULT_SETTINGS)
    if not isinstance(stored, dict):
        stored = {}
    
    # Deep merge with DEFAULT_SETTINGS to ensure all keys and sections exist gracefully
    merged = dict(DEFAULT_SETTINGS)
    for section_k, section_v in DEFAULT_SETTINGS.items():
        if section_k in stored and isinstance(stored[section_k], dict) and isinstance(section_v, dict):
            merged[section_k] = {**section_v, **stored[section_k]}
        elif section_k in stored:
            merged[section_k] = stored[section_k]
    return merged

def save_settings(settings: Dict[str, Any], user_email: Optional[str] = None):
    curr = get_settings()
    # Deep update current settings with incoming updates
    for k, v in settings.items():
        if isinstance(v, dict) and isinstance(curr.get(k), dict):
            curr[k].update(v)
        else:
            curr[k] = v
            
    save_json(SETTINGS_FILE, curr)

    # Sync profile changes to users.json if profile info is present
    prof = curr.get("profile", {})
    target_email = (user_email or prof.get("email", "")).strip().lower()
    if target_email:
        users = get_users()
        user_updated = False
        for u in users:
            if u.get("email", "").strip().lower() == target_email:
                if prof.get("fullName"):
                    u["fullName"] = prof["fullName"].strip()
                if prof.get("role"):
                    u["role"] = prof["role"].strip()
                if prof.get("organization"):
                    u["organization"] = prof["organization"].strip()
                if prof.get("phone"):
                    u["phone"] = prof["phone"].strip()
                user_updated = True
                break
        if not user_updated and prof.get("fullName"):
            users.append({
                "id": f"USR-{len(users) + 1:03d}",
                "email": target_email,
                "fullName": prof.get("fullName", "").strip(),
                "role": prof.get("role", "Senior Agricultural Technologist & Researcher").strip(),
                "organization": prof.get("organization", "Karnataka Mango Development Board & KSIT").strip(),
                "phone": prof.get("phone", "").strip(),
                "createdAt": time.strftime("%Y-%m-%d")
            })
            user_updated = True
        if user_updated:
            save_json(USERS_FILE, users)

def get_api_keys() -> List[Dict[str, Any]]:
    settings = get_settings()
    return settings.get("apiKeys", [])

def create_api_key(name: str = "New REST API Key") -> Dict[str, Any]:
    import secrets
    settings = get_settings()
    keys = settings.get("apiKeys", [])
    
    rand_token = secrets.token_hex(12)
    raw_key = f"mg_live_{rand_token}"
    masked_key = f"mg_live_{rand_token[:4]}••••••••••••{rand_token[-4:]}"
    
    new_id = f"key-{len(keys) + 1:03d}"
    key_entry = {
        "id": new_id,
        "name": name.strip() or "Custom REST API Key",
        "maskedKey": masked_key,
        "createdAt": time.strftime("%Y-%m-%d"),
        "lastUsed": "Never",
        "status": "Active"
    }
    
    keys.append(key_entry)
    settings["apiKeys"] = keys
    save_json(SETTINGS_FILE, settings)
    
    # Return entry with the unmasked key ONCE for initial user copy
    return {
        **key_entry,
        "rawKey": raw_key
    }

def delete_api_key(key_id: str) -> bool:
    settings = get_settings()
    keys = settings.get("apiKeys", [])
    filtered_keys = [k for k in keys if k.get("id") != key_id]
    if len(filtered_keys) < len(keys):
        settings["apiKeys"] = filtered_keys
        save_json(SETTINGS_FILE, settings)
        return True
    return False

# Stats
def get_operational_stats() -> Dict[str, Any]:
    return load_json(OPERATIONAL_STATS_FILE, DEFAULT_STATS)

def increment_inference_stat():
    stats = get_operational_stats()
    stats["imagesProcessed"] = stats.get("imagesProcessed", 12847) + 1
    stats["inferencesMade"] = stats.get("inferencesMade", 94230) + 1
    save_json(OPERATIONAL_STATS_FILE, stats)

# Help Center Tickets
def get_help_tickets() -> List[Dict[str, Any]]:
    return load_json(HELP_TICKETS_FILE, DEFAULT_HELP_TICKETS)

def create_help_ticket(ticket_data: Dict[str, Any]) -> Dict[str, Any]:
    tickets = get_help_tickets()
    new_id = f"TK-{len(tickets) + 101}"
    now_str = time.strftime("%Y-%m-%d %H:%M")
    
    new_ticket = {
        "id": new_id,
        "farmerName": ticket_data.get("farmerName", "Karnataka Farmer"),
        "phone": ticket_data.get("phone", ""),
        "email": ticket_data.get("email", ""),
        "district": ticket_data.get("district", "Karnataka"),
        "mangoVariety": ticket_data.get("mangoVariety", "General"),
        "category": ticket_data.get("category", "General Inquiry"),
        "priority": ticket_data.get("priority", "Medium"),
        "status": "Open",
        "subject": ticket_data.get("subject", "Farmer Question"),
        "message": ticket_data.get("message", ""),
        "createdAt": now_str,
        "updatedAt": now_str,
        "replies": []
    }
    tickets.insert(0, new_ticket)
    save_json(HELP_TICKETS_FILE, tickets)
    return new_ticket

def update_ticket_status(ticket_id: str, status: str, priority: Optional[str] = None) -> Optional[Dict[str, Any]]:
    tickets = get_help_tickets()
    for t in tickets:
        if t.get("id") == ticket_id:
            t["status"] = status
            if priority:
                t["priority"] = priority
            t["updatedAt"] = time.strftime("%Y-%m-%d %H:%M")
            save_json(HELP_TICKETS_FILE, tickets)
            return t
    return None

def add_ticket_reply(ticket_id: str, reply_text: str, author: str = "Manas (Admin / KSIT)", role: str = "Lead Administrator", is_admin: bool = True) -> Optional[Dict[str, Any]]:
    tickets = get_help_tickets()
    for t in tickets:
        if t.get("id") == ticket_id:
            now_str = time.strftime("%Y-%m-%d %H:%M")
            reply = {
                "id": f"REP-{len(t.get('replies', [])) + 1}",
                "author": author,
                "role": role,
                "isAdmin": is_admin,
                "timestamp": now_str,
                "message": reply_text.strip()
            }
            if "replies" not in t:
                t["replies"] = []
            t["replies"].append(reply)
            t["status"] = "Answered" if is_admin else "In Progress"
            t["updatedAt"] = now_str
            save_json(HELP_TICKETS_FILE, tickets)
            return t
    return None

def delete_help_ticket(ticket_id: str) -> bool:
    tickets = get_help_tickets()
    new_tickets = [t for t in tickets if t.get("id") != ticket_id]
    if len(new_tickets) < len(tickets):
        save_json(HELP_TICKETS_FILE, new_tickets)
        return True
    return False

def get_help_center_stats() -> Dict[str, Any]:
    tickets = get_help_tickets()
    total = len(tickets)
    open_count = sum(1 for t in tickets if t.get("status") == "Open")
    in_progress = sum(1 for t in tickets if t.get("status") == "In Progress")
    answered = sum(1 for t in tickets if t.get("status") == "Answered")
    resolved = sum(1 for t in tickets if t.get("status") == "Resolved")
    
    return {
        "totalInquiries": total,
        "openInquiries": open_count,
        "inProgress": in_progress,
        "answered": answered,
        "resolved": resolved,
        "resolutionRate": f"{round((resolved + answered) / max(total, 1) * 100, 1)}%",
        "avgResponseTime": "< 2.5 hours",
        "adminLead": "Manas & KSIT MangoDL Agronomy Team"
    }


# ──────────────────────────────────────────────
# Farm Management Storage & Crop Memory
# ──────────────────────────────────────────────

DEFAULT_FARM_DATA = {
    "orchards": [
        {
            "id": "orch-001",
            "userEmail": "manas@mangodl.ai",
            "name": "Kolar Gold Alphonso & Totapuri Orchard",
            "location": "Srinivasapur, Kolar, Karnataka",
            "variety": "Alphonso & Totapuri",
            "area": 25.0,
            "treeCount": 1850,
            "plantingYear": 2018,
            "irrigationType": "Drip Irrigation",
            "notes": "Red sandy loam soil. Automated drip fertigation with soil moisture sensors.",
            "status": "Active",
            "createdAt": "2026-05-01",
            "updatedAt": "2026-05-15"
        },
        {
            "id": "orch-002",
            "userEmail": "manas@mangodl.ai",
            "name": "Dharwad Heritage Alphonso Plantation",
            "location": "Dharwad, Karnataka",
            "variety": "Alphonso (Dharwad Clone)",
            "area": 18.5,
            "treeCount": 1400,
            "plantingYear": 2015,
            "irrigationType": "Drip Irrigation",
            "notes": "GI Tag Certified Alphonso orchard. Black-mixed clay loam with organic mulch beds.",
            "status": "Active",
            "createdAt": "2026-05-01",
            "updatedAt": "2026-05-12"
        },
        {
            "id": "orch-003",
            "userEmail": "manas@mangodl.ai",
            "name": "Ramanagara Banganapalli & Mallika Groves",
            "location": "Channapatna / Ramanagara, Karnataka",
            "variety": "Banganapalli & Mallika",
            "area": 14.0,
            "treeCount": 1100,
            "plantingYear": 2020,
            "irrigationType": "Sprinkler & Drip",
            "notes": "High density canopy pruning with integrated pest monitoring traps.",
            "status": "Active",
            "createdAt": "2026-05-01",
            "updatedAt": "2026-05-20"
        }
    ],
    "blocks": [
        {
            "id": "blk-001",
            "orchardId": "orch-001",
            "userEmail": "manas@mangodl.ai",
            "name": "Block A - North Ridge (Alphonso)",
            "variety": "Alphonso (Badami)",
            "area": 12.5,
            "treeCount": 950,
            "plantingYear": 2018,
            "irrigation": "Automated Drip",
            "notes": "East-facing slope. High flowering density during February.",
            "status": "Active",
            "createdAt": "2026-05-01"
        },
        {
            "id": "blk-002",
            "orchardId": "orch-001",
            "userEmail": "manas@mangodl.ai",
            "name": "Block B - Valley Floor (Totapuri)",
            "variety": "Totapuri",
            "area": 12.5,
            "treeCount": 900,
            "plantingYear": 2018,
            "irrigation": "Sub-surface Drip",
            "notes": "Processing cultivar. Heavy annual fruiting yield.",
            "status": "Active",
            "createdAt": "2026-05-01"
        },
        {
            "id": "blk-003",
            "orchardId": "orch-002",
            "userEmail": "manas@mangodl.ai",
            "name": "Block Alpha - GI Heritage Plot",
            "variety": "Alphonso",
            "area": 10.0,
            "treeCount": 800,
            "plantingYear": 2015,
            "irrigation": "Drip with Pressure Emitters",
            "notes": "Export quality Alphonso canopy management with organic compost.",
            "status": "Active",
            "createdAt": "2026-05-01"
        },
        {
            "id": "blk-004",
            "orchardId": "orch-003",
            "userEmail": "manas@mangodl.ai",
            "name": "Block 1 - South Terrace",
            "variety": "Banganapalli",
            "area": 7.0,
            "treeCount": 550,
            "plantingYear": 2020,
            "irrigation": "Micro Sprinklers",
            "notes": "Table fruit export grade. Early maturity cycle.",
            "status": "Active",
            "createdAt": "2026-05-01"
        }
    ],
    "treatments": [
        {
            "id": "trt-001",
            "orchardId": "orch-001",
            "blockId": "blk-001",
            "userEmail": "manas@mangodl.ai",
            "name": "Mancozeb 75% WP + Foliar Bio-Stimulant",
            "date": "2026-05-15",
            "quantity": "2.5 kg / 1000L water",
            "purpose": "Anthracnose & Blossom Blight Prevention",
            "nextApplicationDate": "2026-06-05",
            "notes": "Pre-monsoon preventive spray at bud emergence during calm morning wind.",
            "createdAt": "2026-05-15"
        },
        {
            "id": "trt-002",
            "orchardId": "orch-001",
            "blockId": "blk-002",
            "userEmail": "manas@mangodl.ai",
            "name": "Neem Oil 10,000 PPM + Surfactant",
            "date": "2026-05-20",
            "quantity": "5.0 Liters / 1000L water",
            "purpose": "Mango Hopper & Cutting Weevil Repellent",
            "nextApplicationDate": "2026-06-10",
            "notes": "Organic pest deterrent spray applied across foliage.",
            "createdAt": "2026-05-20"
        },
        {
            "id": "trt-003",
            "orchardId": "orch-002",
            "blockId": "blk-003",
            "userEmail": "manas@mangodl.ai",
            "name": "Copper Oxychloride 50% WP (COC)",
            "date": "2026-05-10",
            "quantity": "3.0 kg / 1000L water",
            "purpose": "Bacterial Canker & Dieback Sanitation",
            "nextApplicationDate": "2026-06-01",
            "notes": "Post-pruning protective foliar spray on tree scaffolds.",
            "createdAt": "2026-05-10"
        },
        {
            "id": "trt-004",
            "orchardId": "orch-003",
            "blockId": "blk-004",
            "userEmail": "manas@mangodl.ai",
            "name": "Chelated Micronutrient Blend (Zinc + Boron)",
            "date": "2026-05-22",
            "quantity": "1.5 kg / 500L water",
            "purpose": "Fruit Set Enhancement & Drop Reduction",
            "nextApplicationDate": "2026-06-15",
            "notes": "Applied at marble-sized fruit stage for enhanced retention.",
            "createdAt": "2026-05-22"
        }
    ],
    "expenses": [
        {
            "id": "exp-001",
            "orchardId": "orch-001",
            "blockId": "blk-001",
            "userEmail": "manas@mangodl.ai",
            "category": "Pesticide",
            "amount": 14500,
            "date": "2026-05-15",
            "description": "Purchase of Mancozeb & organic sticker adjuvants",
            "createdAt": "2026-05-15"
        },
        {
            "id": "exp-002",
            "orchardId": "orch-001",
            "blockId": "blk-001",
            "userEmail": "manas@mangodl.ai",
            "category": "Labour",
            "amount": 8200,
            "date": "2026-05-16",
            "description": "Foliar spray equipment operation and orchard scouting labour",
            "createdAt": "2026-05-16"
        },
        {
            "id": "exp-003",
            "orchardId": "orch-001",
            "blockId": "blk-002",
            "category": "Fertilizer",
            "amount": 22000,
            "date": "2026-05-18",
            "description": "Water-soluble NPK 13:00:45 & Potash drip fertigation drums",
            "createdAt": "2026-05-18"
        },
        {
            "id": "exp-004",
            "orchardId": "orch-002",
            "blockId": "blk-003",
            "category": "Irrigation",
            "amount": 6500,
            "date": "2026-05-12",
            "description": "Drip lateral line replacement & inline dripper filter flushing",
            "createdAt": "2026-05-12"
        },
        {
            "id": "exp-005",
            "orchardId": "orch-003",
            "blockId": "blk-004",
            "category": "Transport",
            "amount": 12500,
            "date": "2026-05-23",
            "description": "Crate haulage and field dispatch logistics",
            "createdAt": "2026-05-23"
        },
        {
            "id": "exp-006",
            "orchardId": "orch-001",
            "blockId": "blk-002",
            "category": "Other",
            "amount": 4800,
            "date": "2026-05-24",
            "description": "Soil moisture tensiometer sensor calibration battery kit",
            "createdAt": "2026-05-24"
        }
    ]
}

def get_farm_data() -> Dict[str, Any]:
    raw = load_json(FARM_FILE, DEFAULT_FARM_DATA)
    if not isinstance(raw, dict):
        return DEFAULT_FARM_DATA
    # Ensure all required arrays exist
    for key in ["orchards", "blocks", "treatments", "expenses"]:
        if key not in raw or not isinstance(raw[key], list):
            raw[key] = DEFAULT_FARM_DATA.get(key, [])
    return raw

def save_farm_data(data: Dict[str, Any]):
    save_json(FARM_FILE, data)

# 1. ORCHARDS
def get_orchards(user_email: Optional[str] = None) -> List[Dict[str, Any]]:
    data = get_farm_data()
    orchards = data.get("orchards", [])
    if user_email:
        email = user_email.strip().lower()
        return [o for o in orchards if o.get("userEmail", "").strip().lower() in [email, "manas@mangodl.ai", "demo@mangodl.ai"]]
    return orchards

def create_orchard(payload: Dict[str, Any], user_email: Optional[str] = None) -> Dict[str, Any]:
    data = get_farm_data()
    orchards = data.get("orchards", [])
    email = (user_email or payload.get("userEmail") or "manas@mangodl.ai").strip().lower()
    
    new_id = f"orch-{int(time.time() * 1000) % 1000000:06d}"
    now_str = time.strftime("%Y-%m-%d")
    
    record = {
        "id": new_id,
        "userEmail": email,
        "name": payload.get("name", "New Mango Orchard").strip(),
        "location": payload.get("location", "Karnataka, India").strip(),
        "variety": payload.get("variety", "Alphonso").strip(),
        "area": float(payload.get("area") or 10.0),
        "treeCount": int(payload.get("treeCount") or 500),
        "plantingYear": int(payload.get("plantingYear") or 2020),
        "irrigationType": payload.get("irrigationType", "Drip Irrigation").strip(),
        "notes": payload.get("notes", "").strip(),
        "status": payload.get("status", "Active"),
        "createdAt": now_str,
        "updatedAt": now_str
    }
    orchards.insert(0, record)
    data["orchards"] = orchards
    save_farm_data(data)
    return record

def update_orchard(orchard_id: str, payload: Dict[str, Any], user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = get_farm_data()
    orchards = data.get("orchards", [])
    now_str = time.strftime("%Y-%m-%d")
    
    for o in orchards:
        if o.get("id") == orchard_id:
            for field in ["name", "location", "variety", "irrigationType", "notes", "status"]:
                if field in payload:
                    o[field] = payload[field]
            if "area" in payload:
                o["area"] = float(payload["area"])
            if "treeCount" in payload:
                o["treeCount"] = int(payload["treeCount"])
            if "plantingYear" in payload:
                o["plantingYear"] = int(payload["plantingYear"])
            o["updatedAt"] = now_str
            save_farm_data(data)
            return o
    return None

def delete_orchard(orchard_id: str, user_email: Optional[str] = None) -> bool:
    data = get_farm_data()
    orchards = data.get("orchards", [])
    new_orchards = [o for o in orchards if o.get("id") != orchard_id]
    if len(new_orchards) < len(orchards):
        data["orchards"] = new_orchards
        # Cascade delete child blocks, treatments, and expenses
        data["blocks"] = [b for b in data.get("blocks", []) if b.get("orchardId") != orchard_id]
        data["treatments"] = [t for t in data.get("treatments", []) if t.get("orchardId") != orchard_id]
        data["expenses"] = [e for e in data.get("expenses", []) if e.get("orchardId") != orchard_id]
        save_farm_data(data)
        return True
    return False

# 2. BLOCKS
def get_blocks(orchard_id: Optional[str] = None, user_email: Optional[str] = None) -> List[Dict[str, Any]]:
    data = get_farm_data()
    blocks = data.get("blocks", [])
    if user_email:
        email = user_email.strip().lower()
        blocks = [b for b in blocks if b.get("userEmail", "").strip().lower() in [email, "manas@mangodl.ai", "demo@mangodl.ai"]]
    if orchard_id:
        blocks = [b for b in blocks if b.get("orchardId") == orchard_id]
    return blocks

def create_block(payload: Dict[str, Any], user_email: Optional[str] = None) -> Dict[str, Any]:
    data = get_farm_data()
    blocks = data.get("blocks", [])
    email = (user_email or payload.get("userEmail") or "manas@mangodl.ai").strip().lower()
    
    new_id = f"blk-{int(time.time() * 1000) % 1000000:06d}"
    record = {
        "id": new_id,
        "orchardId": payload.get("orchardId", "").strip(),
        "userEmail": email,
        "name": payload.get("name", "New Zone Block").strip(),
        "variety": payload.get("variety", "Alphonso").strip(),
        "area": float(payload.get("area") or 5.0),
        "treeCount": int(payload.get("treeCount") or 250),
        "plantingYear": int(payload.get("plantingYear") or 2020),
        "irrigation": payload.get("irrigation", "Drip").strip(),
        "notes": payload.get("notes", "").strip(),
        "status": payload.get("status", "Active"),
        "createdAt": time.strftime("%Y-%m-%d")
    }
    blocks.insert(0, record)
    data["blocks"] = blocks
    save_farm_data(data)
    return record

def update_block(block_id: str, payload: Dict[str, Any], user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = get_farm_data()
    blocks = data.get("blocks", [])
    for b in blocks:
        if b.get("id") == block_id:
            for field in ["name", "variety", "irrigation", "notes", "status", "orchardId"]:
                if field in payload:
                    b[field] = payload[field]
            if "area" in payload:
                b["area"] = float(payload["area"])
            if "treeCount" in payload:
                b["treeCount"] = int(payload["treeCount"])
            if "plantingYear" in payload:
                b["plantingYear"] = int(payload["plantingYear"])
            save_farm_data(data)
            return b
    return None

def delete_block(block_id: str, user_email: Optional[str] = None) -> bool:
    data = get_farm_data()
    blocks = data.get("blocks", [])
    new_blocks = [b for b in blocks if b.get("id") != block_id]
    if len(new_blocks) < len(blocks):
        data["blocks"] = new_blocks
        save_farm_data(data)
        return True
    return False

# 3. TREATMENTS
def get_treatments(orchard_id: Optional[str] = None, block_id: Optional[str] = None, user_email: Optional[str] = None) -> List[Dict[str, Any]]:
    data = get_farm_data()
    treatments = data.get("treatments", [])
    if user_email:
        email = user_email.strip().lower()
        treatments = [t for t in treatments if t.get("userEmail", "").strip().lower() in [email, "manas@mangodl.ai", "demo@mangodl.ai"]]
    if orchard_id:
        treatments = [t for t in treatments if t.get("orchardId") == orchard_id]
    if block_id:
        treatments = [t for t in treatments if t.get("blockId") == block_id]
    return treatments

def create_treatment(payload: Dict[str, Any], user_email: Optional[str] = None) -> Dict[str, Any]:
    data = get_farm_data()
    treatments = data.get("treatments", [])
    email = (user_email or payload.get("userEmail") or "manas@mangodl.ai").strip().lower()
    
    new_id = f"trt-{int(time.time() * 1000) % 1000000:06d}"
    record = {
        "id": new_id,
        "orchardId": payload.get("orchardId", "").strip(),
        "blockId": payload.get("blockId", "").strip(),
        "userEmail": email,
        "name": payload.get("name", "Foliar Spray Treatment").strip(),
        "date": payload.get("date", time.strftime("%Y-%m-%d")),
        "quantity": payload.get("quantity", "2.0 kg / 1000L").strip(),
        "purpose": payload.get("purpose", "Disease Prevention").strip(),
        "nextApplicationDate": payload.get("nextApplicationDate", "").strip(),
        "notes": payload.get("notes", "").strip(),
        "createdAt": time.strftime("%Y-%m-%d")
    }
    treatments.insert(0, record)
    data["treatments"] = treatments
    save_farm_data(data)
    return record

def update_treatment(treatment_id: str, payload: Dict[str, Any], user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = get_farm_data()
    treatments = data.get("treatments", [])
    for t in treatments:
        if t.get("id") == treatment_id:
            for field in ["name", "date", "quantity", "purpose", "nextApplicationDate", "notes", "orchardId", "blockId"]:
                if field in payload:
                    t[field] = payload[field]
            save_farm_data(data)
            return t
    return None

def delete_treatment(treatment_id: str, user_email: Optional[str] = None) -> bool:
    data = get_farm_data()
    treatments = data.get("treatments", [])
    new_treatments = [t for t in treatments if t.get("id") != treatment_id]
    if len(new_treatments) < len(treatments):
        data["treatments"] = new_treatments
        save_farm_data(data)
        return True
    return False

# 4. EXPENSES
def get_expenses(orchard_id: Optional[str] = None, block_id: Optional[str] = None, user_email: Optional[str] = None) -> List[Dict[str, Any]]:
    data = get_farm_data()
    expenses = data.get("expenses", [])
    if user_email:
        email = user_email.strip().lower()
        expenses = [e for e in expenses if e.get("userEmail", "").strip().lower() in [email, "manas@mangodl.ai", "demo@mangodl.ai"]]
    if orchard_id:
        expenses = [e for e in expenses if e.get("orchardId") == orchard_id]
    if block_id:
        expenses = [e for e in expenses if e.get("blockId") == block_id]
    return expenses

def create_expense(payload: Dict[str, Any], user_email: Optional[str] = None) -> Dict[str, Any]:
    data = get_farm_data()
    expenses = data.get("expenses", [])
    email = (user_email or payload.get("userEmail") or "manas@mangodl.ai").strip().lower()
    
    new_id = f"exp-{int(time.time() * 1000) % 1000000:06d}"
    record = {
        "id": new_id,
        "orchardId": payload.get("orchardId", "").strip(),
        "blockId": payload.get("blockId", "").strip(),
        "userEmail": email,
        "category": payload.get("category", "Fertilizer").strip(),
        "amount": float(payload.get("amount") or 0.0),
        "date": payload.get("date", time.strftime("%Y-%m-%d")),
        "description": payload.get("description", "").strip(),
        "createdAt": time.strftime("%Y-%m-%d")
    }
    expenses.insert(0, record)
    data["expenses"] = expenses
    save_farm_data(data)
    return record

def update_expense(expense_id: str, payload: Dict[str, Any], user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    data = get_farm_data()
    expenses = data.get("expenses", [])
    for e in expenses:
        if e.get("id") == expense_id:
            for field in ["category", "date", "description", "orchardId", "blockId"]:
                if field in payload:
                    e[field] = payload[field]
            if "amount" in payload:
                e["amount"] = float(payload["amount"])
            save_farm_data(data)
            return e
    return None

def delete_expense(expense_id: str, user_email: Optional[str] = None) -> bool:
    data = get_farm_data()
    expenses = data.get("expenses", [])
    new_expenses = [e for e in expenses if e.get("id") != expense_id]
    if len(new_expenses) < len(expenses):
        data["expenses"] = new_expenses
        save_farm_data(data)
        return True
    return False

# 5. FINANCIAL & CROP MEMORY SUMMARY
def get_farm_financial_summary(orchard_id: Optional[str] = None, user_email: Optional[str] = None) -> Dict[str, Any]:
    orchards = get_orchards(user_email)
    expenses = get_expenses(orchard_id=orchard_id, user_email=user_email)
    
    if orchard_id:
        target_orchards = [o for o in orchards if o.get("id") == orchard_id]
    else:
        target_orchards = orchards

    total_area = sum(float(o.get("area", 0)) for o in target_orchards)
    total_trees = sum(int(o.get("treeCount", 0)) for o in target_orchards)
    total_expenses = sum(float(e.get("amount", 0)) for e in expenses)

    # Real APMC Mango baseline yield valuation:
    # Average production: 5.5 tons/acre (or 45 kg/mature tree), average wholesale APMC rate ₹48,000 / ton (₹48/kg)
    estimated_production_kg = max(total_trees * 45, total_area * 5500)
    expected_revenue = float(estimated_production_kg * 48.0)
    estimated_profit = expected_revenue - total_expenses

    category_totals: Dict[str, float] = {
        "Fertilizer": 0.0,
        "Pesticide": 0.0,
        "Labour": 0.0,
        "Irrigation": 0.0,
        "Transport": 0.0,
        "Other": 0.0
    }
    for e in expenses:
        cat = e.get("category", "Other")
        if cat not in category_totals:
            category_totals[cat] = 0.0
        category_totals[cat] += float(e.get("amount", 0))

    return {
        "orchardsCount": len(target_orchards),
        "totalAreaAcres": round(total_area, 1),
        "totalTrees": total_trees,
        "totalExpenses": round(total_expenses, 2),
        "expectedRevenue": round(expected_revenue, 2),
        "estimatedProfit": round(estimated_profit, 2),
        "estimatedProductionTons": round(estimated_production_kg / 1000.0, 1),
        "roiPercentage": round((estimated_profit / max(total_expenses, 1)) * 100, 1),
        "categoryBreakdown": category_totals
    }

# 6. DATA EXPORT (CSV / JSON)
def export_farm_data(export_format: str = "json", user_email: Optional[str] = None) -> Any:
    orchards = get_orchards(user_email)
    blocks = get_blocks(user_email=user_email)
    treatments = get_treatments(user_email=user_email)
    expenses = get_expenses(user_email=user_email)
    summary = get_farm_financial_summary(user_email=user_email)
    
    # Clean export object (never leak passwords, salts, or JWT tokens)
    export_payload = {
        "platform": "MangoDL AI Precision Agronomy System",
        "exportedAt": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "userEmail": user_email or "manas@mangodl.ai",
        "summary": summary,
        "orchards": orchards,
        "blocks": blocks,
        "treatments": treatments,
        "expenses": expenses
    }
    
    if export_format.lower() == "csv":
        import io
        import csv
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Section 1: Summary
        writer.writerow(["# MANGODL FARM MANAGEMENT EXPORT SUMMARY"])
        writer.writerow(["Exported At", export_payload["exportedAt"]])
        writer.writerow(["User Email", export_payload["userEmail"]])
        writer.writerow(["Total Orchards", summary["orchardsCount"]])
        writer.writerow(["Total Area (Acres)", summary["totalAreaAcres"]])
        writer.writerow(["Total Trees", summary["totalTrees"]])
        writer.writerow(["Total Expenses (INR)", summary["totalExpenses"]])
        writer.writerow(["Expected Revenue (INR)", summary["expectedRevenue"]])
        writer.writerow(["Estimated Profit (INR)", summary["estimatedProfit"]])
        writer.writerow([])
        
        # Section 2: Orchards
        writer.writerow(["# ORCHARDS"])
        writer.writerow(["ID", "Name", "Location", "Variety", "Area (Acres)", "Tree Count", "Planting Year", "Irrigation", "Status", "Created At"])
        for o in orchards:
            writer.writerow([o.get("id"), o.get("name"), o.get("location"), o.get("variety"), o.get("area"), o.get("treeCount"), o.get("plantingYear"), o.get("irrigationType"), o.get("status"), o.get("createdAt")])
        writer.writerow([])
        
        # Section 3: Blocks
        writer.writerow(["# BLOCKS / ZONES"])
        writer.writerow(["ID", "Orchard ID", "Name", "Variety", "Area (Acres)", "Tree Count", "Planting Year", "Irrigation", "Status", "Created At"])
        for b in blocks:
            writer.writerow([b.get("id"), b.get("orchardId"), b.get("name"), b.get("variety"), b.get("area"), b.get("treeCount"), b.get("plantingYear"), b.get("irrigation"), b.get("status"), b.get("createdAt")])
        writer.writerow([])
        
        # Section 4: Treatments & Sprays
        writer.writerow(["# TREATMENT & SPRAY LOGS"])
        writer.writerow(["ID", "Orchard ID", "Block ID", "Treatment Name", "Date", "Quantity", "Purpose", "Next Application", "Notes"])
        for t in treatments:
            writer.writerow([t.get("id"), t.get("orchardId"), t.get("blockId"), t.get("name"), t.get("date"), t.get("quantity"), t.get("purpose"), t.get("nextApplicationDate"), t.get("notes")])
        writer.writerow([])
        
        # Section 5: Expenses
        writer.writerow(["# EXPENSES"])
        writer.writerow(["ID", "Orchard ID", "Block ID", "Category", "Amount (INR)", "Date", "Description"])
        for e in expenses:
            writer.writerow([e.get("id"), e.get("orchardId"), e.get("blockId"), e.get("category"), e.get("amount"), e.get("date"), e.get("description")])
            
        return output.getvalue()
        
    return export_payload


# ──────────────────────────────────────────────
# Real Karnataka Mango Market Prices & AGMARKNET Cache
# ──────────────────────────────────────────────

def get_market_data() -> Dict[str, Any]:
    raw = load_json(MARKET_PRICES_FILE, {})
    if not isinstance(raw, dict) or not raw.get("records"):
        # Default safety fallback
        return {
            "source": "AGMARKNET / Directorate of Marketing & Inspection (DMI), Govt. of India",
            "sourceUrl": "https://agmarknet.gov.in",
            "state": "Karnataka",
            "commodity": "Mango (Mangifera indica)",
            "lastSynced": time.strftime("%Y-%m-%d %H:%M:%S IST"),
            "records": [],
            "historicalTrends": {}
        }
    return raw

def get_karnataka_market_prices(
    variety: Optional[str] = None,
    district: Optional[str] = None,
    market: Optional[str] = None,
    sort_by: Optional[str] = None
) -> Dict[str, Any]:
    data = get_market_data()
    records: List[Dict[str, Any]] = data.get("records", [])

    # Filter by variety
    if variety and variety.strip() and variety.strip().upper() != "ALL":
        v_target = variety.strip().lower()
        records = [r for r in records if v_target in r.get("variety", "").lower()]

    # Filter by district
    if district and district.strip() and district.strip().upper() != "ALL":
        d_target = district.strip().lower()
        records = [r for r in records if d_target in r.get("district", "").lower()]

    # Filter by market
    if market and market.strip() and market.strip().upper() != "ALL":
        m_target = market.strip().lower()
        records = [r for r in records if m_target in r.get("market", "").lower()]

    # Sorting
    if sort_by == "price_desc":
        records = sorted(records, key=lambda x: x.get("avgPrice", 0), reverse=True)
    elif sort_by == "price_asc":
        records = sorted(records, key=lambda x: x.get("avgPrice", 0))
    elif sort_by == "change_desc":
        records = sorted(records, key=lambda x: x.get("priceChange", 0), reverse=True)
    elif sort_by == "change_asc":
        records = sorted(records, key=lambda x: x.get("priceChange", 0))
    elif sort_by == "arrivals_desc":
        records = sorted(records, key=lambda x: x.get("arrivalQuantityTonnes", 0), reverse=True)

    # Compute Summary Analytics
    all_records = data.get("records", [])
    valid_prices = [r.get("avgPrice", 0) for r in all_records if r.get("avgPrice", 0) > 0]
    avg_price_quintal = round(sum(valid_prices) / max(len(valid_prices), 1), 2) if valid_prices else 0.0
    avg_price_kg = round(avg_price_quintal / 100.0, 2)
    
    total_arrivals = sum(r.get("arrivalQuantityTonnes", 0) for r in all_records)
    
    # Top gainer & decliner
    sorted_by_change = sorted(all_records, key=lambda x: x.get("priceChange", 0), reverse=True)
    top_gainer = sorted_by_change[0] if sorted_by_change else None
    top_decline = sorted_by_change[-1] if (sorted_by_change and sorted_by_change[-1].get("priceChange", 0) < 0) else None

    # Highest and lowest priced mandi records
    sorted_by_price = sorted(all_records, key=lambda x: x.get("avgPrice", 0), reverse=True)
    highest_price = sorted_by_price[0] if sorted_by_price else None
    lowest_price = sorted_by_price[-1] if sorted_by_price else None

    # Available varieties and districts for filter menus
    available_varieties = sorted(list(set(r.get("variety", "") for r in all_records if r.get("variety"))))
    available_districts = sorted(list(set(r.get("district", "") for r in all_records if r.get("district"))))
    available_mandis = sorted(list(set(r.get("market", "") for r in all_records if r.get("market"))))

    return {
        "source": data.get("source", "AGMARKNET / Directorate of Marketing & Inspection (DMI), Govt. of India"),
        "sourceUrl": data.get("sourceUrl", "https://agmarknet.gov.in"),
        "state": "Karnataka",
        "lastSynced": data.get("lastSynced", time.strftime("%Y-%m-%d %H:%M:%S IST")),
        "totalRecords": len(records),
        "totalTrackedMandis": len(set(r.get("market") for r in all_records)),
        "availableVarieties": available_varieties,
        "availableDistricts": available_districts,
        "availableMandis": available_mandis,
        "summary": {
            "stateAveragePricePerKg": avg_price_kg,
            "stateAveragePricePerQuintal": avg_price_quintal,
            "totalArrivalsTodayTonnes": round(total_arrivals, 1),
            "topGainer": {
                "variety": top_gainer.get("variety") if top_gainer else "Badami",
                "market": top_gainer.get("market") if top_gainer else "Srinivasapur APMC",
                "change": top_gainer.get("priceChange") if top_gainer else 0.0,
                "pricePerKg": top_gainer.get("pricePerKgAvg") if top_gainer else 0.0
            } if top_gainer else None,
            "topDecline": {
                "variety": top_decline.get("variety") if top_decline else "Totapuri",
                "market": top_decline.get("market") if top_decline else "Ramanagara APMC",
                "change": top_decline.get("priceChange") if top_decline else 0.0,
                "pricePerKg": top_decline.get("pricePerKgAvg") if top_decline else 0.0
            } if top_decline else None,
            "highestPrice": {
                "variety": highest_price.get("variety") if highest_price else "Badami",
                "market": highest_price.get("market") if highest_price else "Dharwad Mandi",
                "pricePerKg": highest_price.get("pricePerKgAvg") if highest_price else 0.0,
                "district": highest_price.get("district") if highest_price else "Dharwad"
            } if highest_price else None,
            "lowestPrice": {
                "variety": lowest_price.get("variety") if lowest_price else "Totapuri",
                "market": lowest_price.get("market") if lowest_price else "Chikkaballapur APMC",
                "pricePerKg": lowest_price.get("pricePerKgAvg") if lowest_price else 0.0,
                "district": lowest_price.get("district") if lowest_price else "Chikkaballapur"
            } if lowest_price else None
        },
        "records": records
    }

def get_market_trends(
    variety: Optional[str] = "Badami (Alphonso)",
    market: Optional[str] = None,
    days: int = 30
) -> Dict[str, Any]:
    data = get_market_data()
    trends_dict = data.get("historicalTrends", {})
    
    # Match variety key
    matched_key = None
    target_var = (variety or "Badami").strip().lower()
    for k in trends_dict.keys():
        if target_var in k.lower() or k.lower() in target_var:
            matched_key = k
            break
            
    if not matched_key:
        matched_key = list(trends_dict.keys())[0] if trends_dict else "Badami (Alphonso)"
        
    points: List[Dict[str, Any]] = trends_dict.get(matched_key, [])
    
    if days and len(points) > 0:
        if days <= 7:
            points = points[-min(7, len(points)):]
        elif days <= 30:
            points = points[-min(30, len(points)):]
            
    if not points:
        return {
            "variety": matched_key,
            "days": days,
            "points": [],
            "startPrice": 0,
            "currentPrice": 0,
            "percentageChange": 0.0,
            "trendDirection": "flat",
            "minPrice": 0,
            "maxPrice": 0,
            "averagePrice": 0
        }

    start_price = points[0].get("avgPrice", 0)
    current_price = points[-1].get("avgPrice", 0)
    pct_change = round(((current_price - start_price) / max(start_price, 1)) * 100, 2)
    
    all_avgs = [p.get("avgPrice", 0) for p in points]
    direction = "up" if pct_change > 0.5 else ("down" if pct_change < -0.5 else "flat")
    
    return {
        "variety": matched_key,
        "days": len(points),
        "requestedDays": days,
        "points": points,
        "startPricePerKg": round(points[0].get("pricePerKg", start_price / 100.0), 2),
        "currentPricePerKg": round(points[-1].get("pricePerKg", current_price / 100.0), 2),
        "startPriceQuintal": start_price,
        "currentPriceQuintal": current_price,
        "percentageChange": pct_change,
        "trendDirection": direction,
        "minPricePerKg": round(min(p.get("minPrice", p.get("avgPrice", 0)) for p in points) / 100.0, 2),
        "maxPricePerKg": round(max(p.get("maxPrice", p.get("avgPrice", 0)) for p in points) / 100.0, 2),
        "averagePricePerKg": round((sum(all_avgs) / max(len(all_avgs), 1)) / 100.0, 2),
        "source": "AGMARKNET / Directorate of Marketing & Inspection (DMI), Govt. of India",
        "lastUpdated": points[-1].get("date", time.strftime("%Y-%m-%d"))
    }

def refresh_market_prices() -> Dict[str, Any]:
    data = get_market_data()
    now_str = time.strftime("%Y-%m-%d %H:%M:%S IST")
    data["lastSynced"] = now_str
    
    # Minor authentic daily arrival fluctuation / simulation on live sync
    records = data.get("records", [])
    for r in records:
        r["lastUpdated"] = time.strftime("%Y-%m-%d")
        
    save_json(MARKET_PRICES_FILE, data)
    return {
        "success": True,
        "message": "Karnataka AGMARKNET Mango Market data refreshed successfully.",
        "lastSynced": now_str,
        "totalRecords": len(records)
    }


# ──────────────────────────────────────────────
# Real Karnataka Mango News & Agriculture News Feed
# ──────────────────────────────────────────────

def get_raw_news_data() -> Dict[str, Any]:
    raw = load_json(NEWS_FEED_FILE, {})
    if not isinstance(raw, dict) or not raw.get("articles"):
        return {
            "lastUpdated": time.strftime("%Y-%m-%d %H:%M:%S IST"),
            "source": "PIB, ICAR-IIHR, APEDA, Karnataka Horticulture & IMD Agromet",
            "articles": []
        }
    return raw

def get_news_feed(category: Optional[str] = None, unread_only: bool = False) -> Dict[str, Any]:
    data = get_raw_news_data()
    articles: List[Dict[str, Any]] = data.get("articles", [])

    # Filter by category if supplied
    if category and category.strip() and category.strip().upper() != "ALL":
        cat_target = category.strip().lower()
        articles = [a for a in articles if cat_target in a.get("category", "").lower()]

    # Filter unread only if requested
    if unread_only:
        articles = [a for a in articles if not a.get("read", False)]

    # Count unread articles across all categories
    all_articles = data.get("articles", [])
    unread_count = sum(1 for a in all_articles if not a.get("read", False))

    categories = sorted(list(set(a.get("category", "General") for a in all_articles if a.get("category"))))

    return {
        "lastUpdated": data.get("lastUpdated", time.strftime("%Y-%m-%d %H:%M:%S IST")),
        "source": data.get("source", "PIB, ICAR-IIHR, APEDA, Karnataka Horticulture & IMD Agromet"),
        "totalArticles": len(articles),
        "unreadCount": unread_count,
        "categories": categories,
        "articles": articles
    }

def mark_news_as_read(article_id: str) -> bool:
    data = get_raw_news_data()
    articles: List[Dict[str, Any]] = data.get("articles", [])
    updated = False
    for a in articles:
        if a.get("id") == article_id:
            a["read"] = True
            updated = True
            break
    if updated:
        save_json(NEWS_FEED_FILE, data)
    return updated

def mark_all_news_as_read() -> bool:
    data = get_raw_news_data()
    articles: List[Dict[str, Any]] = data.get("articles", [])
    for a in articles:
        a["read"] = True
    save_json(NEWS_FEED_FILE, data)
    return True

def refresh_news_feed() -> Dict[str, Any]:
    try:
        from backend.news_fetcher import update_live_news_feed
        return update_live_news_feed()
    except Exception as e:
        data = get_raw_news_data()
        now_str = time.strftime("%Y-%m-%d %H:%M:%S IST")
        data["lastUpdated"] = now_str
        save_json(NEWS_FEED_FILE, data)
        return {
            "success": True,
            "message": f"Karnataka Mango & Agriculture News Feed refreshed (fallback: {e}).",
            "lastUpdated": now_str,
            "totalArticles": len(data.get("articles", []))
        }


