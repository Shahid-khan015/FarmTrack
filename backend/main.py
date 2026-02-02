import os
import sys
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db, get_db_cursor, init_db
from schemas import (
    LoginInput, RegisterInput, TokenResponse, UserResponse,
    TractorCreate, TractorUpdate, TractorResponse,
    ImplementCreate, ImplementUpdate, ImplementResponse,
    OperationCreate, OperationResponse,
    TelemetryCreate, TelemetryResponse,
    FuelLogCreate, FuelLogResponse,
    AlertCreate, AlertResponse,
    DashboardStats, ReportResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role
)

app = FastAPI(title="Fleet Management API", docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def dict_from_row(row):
    if row is None:
        return None
    result = {}
    for key, value in row.items():
        if value is None:
            result[key] = None
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, uuid.UUID):
            result[key] = str(value)
        elif isinstance(value, dict):
            result[key] = value
        else:
            result[key] = value
    return result

def camel_case(snake_str):
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def row_to_camel_case(row):
    if row is None:
        return None
    result = {}
    for key, value in dict_from_row(row).items():
        if isinstance(value, datetime):
            result[camel_case(key)] = value.isoformat()
        elif isinstance(value, uuid.UUID):
            result[camel_case(key)] = str(value)
        else:
            result[camel_case(key)] = value
    return result

@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(data: RegisterInput, conn = Depends(get_db)):
    cursor = get_db_cursor(conn)
    
    cursor.execute("SELECT id FROM users WHERE username = %s", (data.username,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(data.password)
    try:
        cursor.execute(
            """INSERT INTO users (id, username, password, full_name, role, phone, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (user_id, data.username, hashed_password, data.fullName, 
             data.role or "operator", data.phone, True)
        )
        conn.commit()
    except psycopg2.IntegrityError as e:
        conn.rollback()
        cursor.close()
        raise HTTPException(status_code=409, detail="User with given username or phone already exists")
    
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()
    
    token = create_access_token({
        "id": str(user["id"]),
        "username": user["username"],
        "role": user["role"],
        "fullName": user["full_name"]
    })
    
    return {
        "token": token,
        "user": {
            "id": str(user["id"]),
            "username": user["username"],
            "fullName": user["full_name"],
            "role": user["role"],
            "phone": user["phone"],
            "isActive": user["is_active"]
        }
    }

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(data: LoginInput, conn = Depends(get_db)):
    cursor = get_db_cursor(conn)
    
    cursor.execute("SELECT * FROM users WHERE username = %s", (data.username,))
    user = cursor.fetchone()
    cursor.close()
    
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({
        "id": str(user["id"]),
        "username": user["username"],
        "role": user["role"],
        "fullName": user["full_name"]
    })
    
    return {
        "token": token,
        "user": {
            "id": str(user["id"]),
            "username": user["username"],
            "fullName": user["full_name"],
            "role": user["role"],
            "phone": user["phone"],
            "isActive": user["is_active"]
        }
    }

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    
    cursor.execute("SELECT COUNT(*) as count FROM tractors")
    tractors_count = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM implements")
    implements_count = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM operations WHERE status = 'active'")
    active_ops_count = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM alerts WHERE is_resolved = FALSE")
    unresolved_alerts_count = cursor.fetchone()["count"]
    
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    cursor.execute(
        "SELECT COALESCE(SUM(quantity), 0) as total FROM fuel_logs WHERE timestamp >= %s AND timestamp < %s",
        (today, tomorrow)
    )
    today_fuel = cursor.fetchone()["total"]
    
    cursor.execute(
        """SELECT o.id, o.operation_type, o.status, o.start_time, t.manufacturer_name, t.model, u.full_name
           FROM operations o
           JOIN tractors t ON o.tractor_id = t.id
           JOIN users u ON o.operator_id = u.id
           ORDER BY o.start_time DESC LIMIT 5"""
    )
    
    recent_ops = []
    for row in cursor.fetchall():
        recent_ops.append({
            "id": str(row["id"]),
            "operationType": row["operation_type"],
            "tractorName": f"{row['manufacturer_name']} {row['model']}",
            "operatorName": row["full_name"],
            "status": row["status"],
            "startTime": row["start_time"].isoformat() if row["start_time"] else None
        })
    
    cursor.close()
    
    return {
        "tractorsCount": tractors_count,
        "implementsCount": implements_count,
        "activeOperations": active_ops_count,
        "todayFuelUsage": float(today_fuel),
        "unresolvedAlerts": unresolved_alerts_count,
        "recentOperations": recent_ops
    }

@app.get("/api/tractors")
async def get_tractors(
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    cursor.execute("SELECT * FROM tractors ORDER BY created_at DESC")
    tractors = [row_to_camel_case(row) for row in cursor.fetchall()]
    cursor.close()
    return tractors

@app.post("/api/tractors")
async def create_tractor(
    data: TractorCreate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    tractor_id = str(uuid.uuid4())
    
    try:
        cursor.execute(
            """INSERT INTO tractors (id, owner_id, manufacturer_name, model, registration_number, specifications, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (tractor_id, current_user["id"], data.manufacturerName, data.model, 
             data.registrationNumber, json.dumps(data.specifications) if data.specifications else None,
             data.isActive if data.isActive is not None else True)
        )
        conn.commit()
    except psycopg2.IntegrityError:
        conn.rollback()
        cursor.close()
        raise HTTPException(status_code=409, detail="Tractor with given registration number already exists")
    
    cursor.execute("SELECT * FROM tractors WHERE id = %s", (tractor_id,))
    tractor = cursor.fetchone()
    cursor.close()
    
    return row_to_camel_case(tractor)

@app.patch("/api/tractors/{tractor_id}")
async def update_tractor(
    tractor_id: str,
    data: TractorUpdate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    
    updates = []
    params = []
    
    if data.manufacturerName is not None:
        updates.append("manufacturer_name = %s")
        params.append(data.manufacturerName)
    if data.model is not None:
        updates.append("model = %s")
        params.append(data.model)
    if data.registrationNumber is not None:
        updates.append("registration_number = %s")
        params.append(data.registrationNumber)
    if data.specifications is not None:
        updates.append("specifications = %s")
        params.append(json.dumps(data.specifications))
    if data.isActive is not None:
        updates.append("is_active = %s")
        params.append(data.isActive)
    
    if not updates:
        cursor.execute("SELECT * FROM tractors WHERE id = %s", (tractor_id,))
        tractor = cursor.fetchone()
        cursor.close()
        return row_to_camel_case(tractor)
    
    params.append(tractor_id)
    query = f"UPDATE tractors SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(query, params)
    conn.commit()
    
    cursor.execute("SELECT * FROM tractors WHERE id = %s", (tractor_id,))
    tractor = cursor.fetchone()
    cursor.close()
    
    if not tractor:
        raise HTTPException(status_code=404, detail="Tractor not found")
    
    return row_to_camel_case(tractor)

@app.delete("/api/tractors/{tractor_id}")
async def delete_tractor(
    tractor_id: str,
    current_user = Depends(require_role("owner")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    
    cursor.execute("DELETE FROM tractors WHERE id = %s", (tractor_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Tractor not found")
    
    cursor.close()
    return {"success": True}

@app.get("/api/implements")
async def get_implements(
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    cursor.execute("SELECT * FROM implements ORDER BY created_at DESC")
    implements = [row_to_camel_case(row) for row in cursor.fetchall()]
    cursor.close()
    return implements

@app.post("/api/implements")
async def create_implement(
    data: ImplementCreate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    implement_id = str(uuid.uuid4())
    
    cursor.execute("SELECT id FROM implements WHERE owner_id = %s AND name = %s", (current_user["id"], data.name))
    if cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=409, detail="Implement with this name already exists for the owner")

    try:
        cursor.execute(
            """INSERT INTO implements (id, owner_id, operation_type, name, brand_name, working_width, specifications, is_active)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (implement_id, current_user["id"], data.operationType, data.name, data.brandName,
             data.workingWidth, json.dumps(data.specifications) if data.specifications else None,
             data.isActive if data.isActive is not None else True)
        )
        conn.commit()
    except psycopg2.IntegrityError:
        conn.rollback()
        cursor.close()
        raise HTTPException(status_code=409, detail="Implement duplicate or constraint violation")

    cursor.execute("SELECT * FROM implements WHERE id = %s", (implement_id,))
    implement = cursor.fetchone()
    cursor.close()

    return row_to_camel_case(implement)

@app.patch("/api/implements/{implement_id}")
async def update_implement(
    implement_id: str,
    data: ImplementUpdate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    
    updates = []
    params = []
    
    if data.operationType is not None:
        updates.append("operation_type = %s")
        params.append(data.operationType)
    if data.name is not None:
        updates.append("name = %s")
        params.append(data.name)
    if data.brandName is not None:
        updates.append("brand_name = %s")
        params.append(data.brandName)
    if data.workingWidth is not None:
        updates.append("working_width = %s")
        params.append(data.workingWidth)
    if data.specifications is not None:
        updates.append("specifications = %s")
        params.append(json.dumps(data.specifications))
    if data.isActive is not None:
        updates.append("is_active = %s")
        params.append(data.isActive)
    
    if not updates:
        cursor.execute("SELECT * FROM implements WHERE id = %s", (implement_id,))
        implement = cursor.fetchone()
        cursor.close()
        return row_to_camel_case(implement)
    
    params.append(implement_id)
    query = f"UPDATE implements SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(query, params)
    conn.commit()
    
    cursor.execute("SELECT * FROM implements WHERE id = %s", (implement_id,))
    implement = cursor.fetchone()
    cursor.close()
    
    if not implement:
        raise HTTPException(status_code=404, detail="Implement not found")
    
    return row_to_camel_case(implement)

@app.delete("/api/implements/{implement_id}")
async def delete_implement(
    implement_id: str,
    current_user = Depends(require_role("owner")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    
    cursor.execute("DELETE FROM implements WHERE id = %s", (implement_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Implement not found")
    
    cursor.close()
    return {"success": True}

@app.get("/api/operations")
async def get_operations(
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    cursor.execute(
        """SELECT o.*, t.manufacturer_name, t.model, t.registration_number, i.name as implement_name, i.brand_name, i.working_width, u.full_name
           FROM operations o
           LEFT JOIN tractors t ON o.tractor_id = t.id
           LEFT JOIN implements i ON o.implement_id = i.id
           LEFT JOIN users u ON o.operator_id = u.id
           ORDER BY o.start_time DESC"""
    )
    
    result = []
    for row in cursor.fetchall():
        op = row_to_camel_case(row)
        op["tractor"] = {
            "id": str(row["tractor_id"]),
            "manufacturerName": row["manufacturer_name"],
            "model": row["model"],
            "registrationNumber": row["registration_number"]
        } if row["tractor_id"] else None
        op["implement"] = {
            "id": str(row["implement_id"]),
            "name": row["implement_name"],
            "brandName": row["brand_name"],
            "workingWidth": row["working_width"]
        } if row["implement_id"] else None
        op["operator"] = {
            "fullName": row["full_name"]
        } if row["full_name"] else None
        result.append(op)
    
    cursor.close()
    return result

@app.post("/api/operations")
async def create_operation(
    data: OperationCreate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    op_id = str(uuid.uuid4())
    telem_id = str(uuid.uuid4())
    now = datetime.now()
    
    cursor.execute("SELECT id FROM operations WHERE tractor_id = %s AND status = 'active'", (data.tractorId,))
    if cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=400, detail="An active operation already exists for this tractor")

    try:
        cursor.execute(
            """INSERT INTO operations (id, tractor_id, implement_id, operator_id, operation_type, status, start_time, notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (op_id, data.tractorId, data.implementId, current_user["id"], data.operationType, 
             "active", now, data.notes)
        )

        cursor.execute(
            """INSERT INTO telemetry (id, operation_id, tractor_id, engine_on, pto_on, is_moving, speed, timestamp)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (operation_id, tractor_id, timestamp) DO NOTHING""",
            (telem_id, op_id, data.tractorId, True, False, False, 0, now)
        )

        conn.commit()
    except psycopg2.IntegrityError:
        conn.rollback()
        cursor.close()
        raise HTTPException(status_code=409, detail="Operation or telemetry conflict occurred")

    cursor.execute("SELECT * FROM operations WHERE id = %s", (op_id,))
    operation = cursor.fetchone()
    cursor.close()

    return row_to_camel_case(operation)

@app.post("/api/operations/{operation_id}/stop")
async def stop_operation(
    operation_id: str,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    now = datetime.now()
    telem_id = str(uuid.uuid4())
    
    cursor.execute("SELECT tractor_id FROM operations WHERE id = %s", (operation_id,))
    row = cursor.fetchone()
    
    if not row:
        cursor.close()
        raise HTTPException(status_code=404, detail="Operation not found")
    
    tractor_id = row["tractor_id"]
    
    cursor.execute(
        "UPDATE operations SET status = %s, end_time = %s WHERE id = %s",
        ("completed", now, operation_id)
    )
    
    cursor.execute(
        """INSERT INTO telemetry (id, operation_id, tractor_id, engine_on, pto_on, is_moving, speed, timestamp)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (telem_id, operation_id, tractor_id, False, False, False, 0, now)
    )
    
    conn.commit()
    
    cursor.execute("SELECT * FROM operations WHERE id = %s", (operation_id,))
    operation = cursor.fetchone()
    cursor.close()
    
    return row_to_camel_case(operation)

@app.get("/api/telemetry/{operation_id}")
async def get_telemetry(
    operation_id: str,
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    cursor.execute(
        "SELECT * FROM telemetry WHERE operation_id = %s ORDER BY timestamp DESC",
        (operation_id,)
    )
    telemetry = [row_to_camel_case(row) for row in cursor.fetchall()]
    cursor.close()
    return telemetry

@app.post("/api/telemetry")
async def create_telemetry(
    data: TelemetryCreate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    telem_id = str(uuid.uuid4())
    now = datetime.now()
    
    cursor.execute(
        """INSERT INTO telemetry (id, operation_id, tractor_id, engine_on, latitude, longitude, is_moving, pto_on, speed, implement_data, timestamp)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (operation_id, tractor_id, timestamp) DO NOTHING
           RETURNING *""",
        (telem_id, data.operationId, data.tractorId, data.engineOn, data.latitude, data.longitude,
         data.isMoving or False, data.ptoOn or False, data.speed or 0,
         json.dumps(data.implementData) if data.implementData else None, now)
    )

    telemetry = cursor.fetchone()
    if not telemetry:
        cursor.execute("SELECT * FROM telemetry WHERE operation_id = %s AND tractor_id = %s AND timestamp = %s",
                       (data.operationId, data.tractorId, now))
        telemetry = cursor.fetchone()

    conn.commit()
    cursor.close()

    return row_to_camel_case(telemetry)

@app.get("/api/fuel-logs")
async def get_fuel_logs(
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    cursor.execute(
        """SELECT f.*, t.registration_number, t.manufacturer_name, t.model, u.full_name
           FROM fuel_logs f
           LEFT JOIN tractors t ON f.tractor_id = t.id
           LEFT JOIN users u ON f.operator_id = u.id
           ORDER BY f.timestamp DESC"""
    )
    
    result = []
    for row in cursor.fetchall():
        log = row_to_camel_case(row)
        log["tractor"] = {
            "id": str(row["tractor_id"]),
            "registrationNumber": row["registration_number"],
            "manufacturerName": row["manufacturer_name"],
            "model": row["model"]
        } if row["tractor_id"] else None
        log["operator"] = {
            "fullName": row["full_name"]
        } if row["full_name"] else None
        result.append(log)
    
    cursor.close()
    return result

@app.post("/api/fuel-logs")
async def create_fuel_log(
    data: FuelLogCreate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    log_id = str(uuid.uuid4())
    now = datetime.now()
    
    cursor.execute(
        """INSERT INTO fuel_logs (id, tractor_id, operator_id, operation_id, quantity, notes, timestamp)
           VALUES (%s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (tractor_id, timestamp) DO NOTHING
           RETURNING *""",
        (log_id, data.tractorId, current_user["id"], data.operationId, data.quantity, data.notes, now)
    )

    fuel_log = cursor.fetchone()
    if not fuel_log:
        cursor.execute("SELECT * FROM fuel_logs WHERE tractor_id = %s AND timestamp = %s", (data.tractorId, now))
        fuel_log = cursor.fetchone()

    conn.commit()
    cursor.close()

    return row_to_camel_case(fuel_log)

@app.get("/api/alerts")
async def get_alerts(
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    cursor.execute(
        """SELECT a.*, t.manufacturer_name, t.model
           FROM alerts a
           LEFT JOIN tractors t ON a.tractor_id = t.id
           ORDER BY a.timestamp DESC"""
    )
    
    result = []
    for row in cursor.fetchall():
        alert = row_to_camel_case(row)
        alert["tractor"] = {
            "id": str(row["tractor_id"]),
            "manufacturerName": row["manufacturer_name"],
            "model": row["model"]
        } if row["tractor_id"] else None
        result.append(alert)
    
    cursor.close()
    return result

@app.post("/api/alerts")
async def create_alert(
    data: AlertCreate,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    alert_id = str(uuid.uuid4())
    now = datetime.now()
    
    cursor.execute(
        """INSERT INTO alerts (id, tractor_id, operation_id, alert_type, message, timestamp)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON CONFLICT (tractor_id, operation_id, alert_type, timestamp) DO NOTHING
           RETURNING *""",
        (alert_id, data.tractorId, data.operationId, data.alertType, data.message, now)
    )

    alert = cursor.fetchone()
    if not alert:
        cursor.execute("SELECT * FROM alerts WHERE tractor_id = %s AND operation_id = %s AND alert_type = %s AND timestamp = %s",
                       (data.tractorId, data.operationId, data.alertType, now))
        alert = cursor.fetchone()

    conn.commit()
    cursor.close()

    return row_to_camel_case(alert)

@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user = Depends(require_role("owner", "operator")),
    conn = Depends(get_db)
):
    cursor = get_db_cursor(conn)
    
    cursor.execute("UPDATE alerts SET is_resolved = TRUE WHERE id = %s", (alert_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Alert not found")
    
    cursor.execute("SELECT * FROM alerts WHERE id = %s", (alert_id,))
    alert = cursor.fetchone()
    cursor.close()
    
    return row_to_camel_case(alert)

@app.get("/api/reports")
async def get_reports(
    filterType: Optional[str] = None,
    date: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    startTime: Optional[str] = None,
    endTime: Optional[str] = None,
    current_user = Depends(get_current_user),
    conn = Depends(get_db)
):
    now = datetime.now()
    
    if filterType == "day" and date:
        start = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filterType == "date-range" and startDate and endDate:
        start = datetime.fromisoformat(startDate).replace(hour=0, minute=0, second=0, microsecond=0)
        end = datetime.fromisoformat(endDate).replace(hour=23, minute=59, second=59, microsecond=999999)
    elif filterType == "datetime-range" and startDate and endDate and startTime and endTime:
        start = datetime.fromisoformat(f"{startDate}T{startTime}")
        end = datetime.fromisoformat(f"{endDate}T{endTime}")
    else:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    cursor = get_db_cursor(conn)
    
    cursor.execute(
        """SELECT o.*, t.manufacturer_name, t.model, i.working_width, u.full_name
           FROM operations o
           JOIN tractors t ON o.tractor_id = t.id
           JOIN implements i ON o.implement_id = i.id
           JOIN users u ON o.operator_id = u.id
           WHERE o.start_time >= %s AND o.start_time <= %s
           ORDER BY o.start_time DESC""",
        (start, end)
    )
    
    operations = cursor.fetchall()
    total_hours = 0
    total_area = 0
    operation_details = []
    
    for op in operations:
        start_time = op["start_time"]
        end_time = op["end_time"] or now
        duration_hours = (end_time - start_time).total_seconds() / 3600
        
        working_width = op["working_width"] or 2
        avg_speed = 5
        area_covered = (working_width * avg_speed * duration_hours) / 10
        
        total_hours += duration_hours
        total_area += area_covered
        
        operation_details.append({
            "id": str(op["id"]),
            "operationType": op["operation_type"],
            "tractorName": f"{op['manufacturer_name']} {op['model']}",
            "operatorName": op["full_name"],
            "startTime": op["start_time"].isoformat() if op["start_time"] else None,
            "endTime": op["end_time"].isoformat() if op["end_time"] else None,
            "duration": duration_hours,
            "areaCovered": area_covered
        })
    
    cursor.execute(
        "SELECT f.*, t.registration_number FROM fuel_logs f LEFT JOIN tractors t ON f.tractor_id = t.id WHERE f.timestamp >= %s AND f.timestamp <= %s ORDER BY f.timestamp DESC",
        (start, end)
    )
    
    fuel_logs = cursor.fetchall()
    fuel_total = sum(log["quantity"] for log in fuel_logs)
    fuel_log_details = []
    
    for log in fuel_logs:
        fuel_log_details.append({
            "id": str(log["id"]),
            "quantity": log["quantity"],
            "tractorName": log["registration_number"] or "Unknown",
            "timestamp": log["timestamp"].isoformat() if log["timestamp"] else None
        })
    
    cursor.execute(
        "SELECT * FROM alerts WHERE timestamp >= %s AND timestamp <= %s ORDER BY timestamp DESC",
        (start, end)
    )
    
    alerts = cursor.fetchall()
    breakdowns = sum(1 for a in alerts if a["alert_type"] == "breakdown")
    alert_logs = []
    
    for alert in alerts:
        alert_logs.append({
            "id": str(alert["id"]),
            "message": alert["message"],
            "alertType": alert["alert_type"],
            "timestamp": alert["timestamp"].isoformat() if alert["timestamp"] else None,
            "isResolved": alert["is_resolved"]
        })
    
    cursor.close()
    
    return {
        "totalHours": total_hours,
        "totalArea": total_area,
        "fuelUsed": fuel_total,
        "breakdowns": breakdowns,
        "alerts": len(alerts),
        "operations": operation_details,
        "fuelLogs": fuel_log_details,
        "alertLogs": alert_logs
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    print(f"Starting FastAPI server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
