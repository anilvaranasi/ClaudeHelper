# Moveworks Object Builder — ServiceNow Scoped App

AI-powered ServiceNow Scoped App that uses **Claude (Anthropic)** to generate valid Moveworks objects (Actions, Events, Slots) from natural language requests.

---

## Architecture

```
User (Service Portal)
      │
      ▼
Widget (moveworks_builder)
  ├── client_script.js   → AngularJS controller
  ├── server_script.js   → Server-side GlideRecord + API call
  └── widget.html / .css → UI
      │
      ▼
Script Include: MoveworksBuilder.js
      │
      ▼
REST Message: Moveworks Claude API
      │
      ▼
Anthropic Claude API (claude-3-5-sonnet)
      │
      ▼
Custom Table: x_mwb_mw_object  ← Stores generated objects
```

---

## Files

| File | Purpose |
|------|---------|
| `sys_app.xml` | Scoped app manifest (scope: `x_mwb`) |
| `script_includes/MoveworksBuilder.js` | Core logic — calls Claude API via REST |
| `rest_messages/MoveworksClaudeAPI.xml` | Outbound REST message to Anthropic |
| `tables/x_mwb_mw_object.xml` | Custom table schema |
| `widgets/moveworks_builder/widget.html` | Service Portal widget UI |
| `widgets/moveworks_builder/widget.css` | Widget styles |
| `widgets/moveworks_builder/client_script.js` | AngularJS client controller |
| `widgets/moveworks_builder/server_script.js` | Server-side data handler |
| `business_rules/MoveworksObjectDefaults.xml` | Auto-populates fields on insert |
| `acls/x_mwb_mw_object.xml` | Role-based access control |

---

## Setup Instructions

### 1. Create the Scoped App in ServiceNow Studio
1. Navigate to **Studio** → **Create Application**
2. Name: `Moveworks Object Builder`
3. Scope: `x_mwb`

### 2. Import the XML Files
Use **System Update Sets** or **Studio Source Control** to import each XML file in this order:
1. `sys_app.xml`
2. `tables/x_mwb_mw_object.xml`
3. `rest_messages/MoveworksClaudeAPI.xml`
4. `script_includes/MoveworksBuilder.js`
5. `business_rules/MoveworksObjectDefaults.xml`
6. `acls/x_mwb_mw_object.xml`
7. Widget files (all 4)

### 3. Configure the Anthropic API Key
1. Open **REST Messages** → `Moveworks Claude API`
2. Open the **Build Object** HTTP Method
3. Replace `YOUR_ANTHROPIC_API_KEY_HERE` in the `x-api-key` header with your real key
> ⚠️ Use a **ServiceNow Credential** or **sys_properties** to store the key securely — never hardcode in XML for production.

### 4. Add the Widget to a Service Portal Page
1. Go to **Service Portal** → **Pages**
2. Create a new page or open an existing one
3. Drag the **moveworks_builder** widget onto the page
4. Publish

### 5. Assign Roles
- `x_mwb.user` — can use the builder and view objects
- `x_mwb.admin` — can edit and manage objects

---

## Usage

1. Navigate to the Service Portal page with the widget
2. Type your request, e.g.: *"Create an action to provision Slack access for a new employee"*
3. Select the object type (Action / Event / Slot)
4. Click **⚡ Build Object**
5. Review the generated JSON
6. Click **💾 Save to ServiceNow** to store it

---

## Supported Object Types

| Type | ID Prefix | Key Fields |
|------|-----------|------------|
| Action | `action.` | parameters, output |
| Event | `event.` | trigger, payload |
| Slot | `slot.` | data_type, required, default_value |