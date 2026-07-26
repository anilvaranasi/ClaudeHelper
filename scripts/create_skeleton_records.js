/**
 * MOVEWORKS OBJECT BUILDER — SKELETON RECORD CREATOR
 * ====================================================
 * Run this in: System Definition → Scripts - Background
 * Scope: Global (run as admin)
 *
 * What this creates:
 *   1. Script Include  — MoveworksBuilder
 *   2. REST Message    — Moveworks Claude API (+ HTTP Method + Headers)
 *   3. Table           — x_146833_movewor_0_mw_object (extends task)
 *   4. Table columns   — request, object_id, object_name, object_type, object_json, state
 *   5. Service Portal Widget — moveworks_builder
 *
 * After running: go to Studio → Source Control → Commit to push to nowdev
 */

var APP_SCOPE    = 'x_146833_movewor_0';
var APP_SYS_ID   = '063f0c869312c710945375dcebba1005';
var TABLE_NAME   = 'x_146833_movewor_0_mw_object';
var results      = [];

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────
function log(label, sysId) {
    var msg = label + ' → sys_id: ' + sysId;
    results.push(msg);
    gs.info('[MWB Setup] ' + msg);
}

function setScopeFields(gr) {
    gr.setValue('sys_scope',   APP_SYS_ID);
    gr.setValue('sys_package', APP_SYS_ID);
}

// ─────────────────────────────────────────────────────────────
// 1. SCRIPT INCLUDE — MoveworksBuilder
// ─────────────────────────────────────────────────────────────
(function createScriptInclude() {
    // Skip if already exists
    var check = new GlideRecord('sys_script_include');
    check.addQuery('name', 'MoveworksBuilder');
    check.addQuery('sys_scope', APP_SYS_ID);
    check.query();
    if (check.next()) {
        log('Script Include already exists — skipping', check.sys_id);
        return;
    }

    var gr = new GlideRecord('sys_script_include');
    gr.initialize();
    gr.setValue('name',         'MoveworksBuilder');
    gr.setValue('api_name',     APP_SCOPE + '.MoveworksBuilder');
    gr.setValue('active',       true);
    gr.setValue('access',       'public');
    gr.setValue('client_callable', true);
    gr.setValue('description',  'Builds Moveworks objects via Claude API');
    gr.setValue('script', [
        'var MoveworksBuilder = Class.create();',
        'MoveworksBuilder.prototype = Object.extendsObject(AbstractAjaxProcessor, {',
        '    // TODO: logic will be added here after source control commit',
        '    buildObject: function() {',
        '        return "{}";',
        '    },',
        '    type: "MoveworksBuilder"',
        '});'
    ].join('\n'));
    setScopeFields(gr);
    var sysId = gr.insert();
    log('Script Include: MoveworksBuilder', sysId);
})();


// ─────────────────────────────────────────────────────────────
// 2. REST MESSAGE — Moveworks Claude API
// ─────────────────────────────────────────────────────────────
var restMessageSysId;
(function createRESTMessage() {
    var check = new GlideRecord('sys_rest_message');
    check.addQuery('name', 'Moveworks Claude API');
    check.addQuery('sys_scope', APP_SYS_ID);
    check.query();
    if (check.next()) {
        restMessageSysId = check.sys_id.toString();
        log('REST Message already exists — skipping', restMessageSysId);
        return;
    }

    var gr = new GlideRecord('sys_rest_message');
    gr.initialize();
    gr.setValue('name',        'Moveworks Claude API');
    gr.setValue('description', 'Anthropic Claude API for Moveworks object generation');
    gr.setValue('base_url',    'https://api.anthropic.com');
    setScopeFields(gr);
    restMessageSysId = gr.insert();
    log('REST Message: Moveworks Claude API', restMessageSysId);
})();


// ─────────────────────────────────────────────────────────────
// 3. REST MESSAGE HTTP METHOD — Build Object
// ─────────────────────────────────────────────────────────────
var restMethodSysId;
(function createRESTMethod() {
    if (!restMessageSysId) return;

    var check = new GlideRecord('sys_rest_message_fn');
    check.addQuery('name', 'Build Object');
    check.addQuery('rest_message', restMessageSysId);
    check.query();
    if (check.next()) {
        restMethodSysId = check.sys_id.toString();
        log('REST Method already exists — skipping', restMethodSysId);
        return;
    }

    var gr = new GlideRecord('sys_rest_message_fn');
    gr.initialize();
    gr.setValue('name',          'Build Object');
    gr.setValue('function_name', 'Build Object');
    gr.setValue('http_method',   'post');
    gr.setValue('rest_endpoint', 'https://api.anthropic.com/v1/messages');
    gr.setValue('rest_message',  restMessageSysId);
    setScopeFields(gr);
    restMethodSysId = gr.insert();
    log('REST Method: Build Object', restMethodSysId);
})();


// ─────────────────────────────────────────────────────────────
// 4. REST MESSAGE HEADERS
// ─────────────────────────────────────────────────────────────
(function createRESTHeaders() {
    if (!restMethodSysId) return;

    var headers = [
        { name: 'x-api-key',          value: 'YOUR_ANTHROPIC_API_KEY_HERE' },
        { name: 'anthropic-version',   value: '2023-06-01'                  },
        { name: 'content-type',        value: 'application/json'            }
    ];

    headers.forEach(function(h) {
        var check = new GlideRecord('sys_rest_message_fn_headers');
        check.addQuery('name', h.name);
        check.addQuery('message_function', restMethodSysId);
        check.query();
        if (check.next()) {
            log('Header already exists — skipping: ' + h.name, check.sys_id);
            return;
        }

        var gr = new GlideRecord('sys_rest_message_fn_headers');
        gr.initialize();
        gr.setValue('name',             h.name);
        gr.setValue('value',            h.value);
        gr.setValue('message_function', restMethodSysId);
        setScopeFields(gr);
        var sysId = gr.insert();
        log('REST Header: ' + h.name, sysId);
    });
})();


// ─────────────────────────────────────────────────────────────
// 5. CUSTOM TABLE — x_146833_movewor_0_mw_object
// ─────────────────────────────────────────────────────────────
var tableExists = false;
(function createTable() {
    var check = new GlideRecord('sys_db_object');
    check.addQuery('name', TABLE_NAME);
    check.query();
    if (check.next()) {
        tableExists = true;
        log('Table already exists — skipping', check.sys_id);
        return;
    }

    var gr = new GlideRecord('sys_db_object');
    gr.initialize();
    gr.setValue('name',         TABLE_NAME);
    gr.setValue('label',        'Moveworks Object');
    gr.setValue('plural_label', 'Moveworks Objects');
    gr.setValue('super_class',  'task'); // extends Task
    setScopeFields(gr);
    var sysId = gr.insert();
    log('Table: ' + TABLE_NAME, sysId);
})();


// ─────────────────────────────────────────────────────────────
// 6. TABLE COLUMNS
// ─────────────────────────────────────────────────────────────
(function createColumns() {
    var columns = [
        { element: 'request',      label: 'User Request',   type: 'string',           max: 1000  },
        { element: 'object_id',    label: 'Object ID',      type: 'string',           max: 255   },
        { element: 'object_name',  label: 'Object Name',    type: 'string',           max: 255   },
        { element: 'object_type',  label: 'Object Type',    type: 'string',           max: 50    },
        { element: 'object_json',  label: 'Generated JSON', type: 'translated_text',  max: 8000  },
        { element: 'state',        label: 'State',          type: 'string',           max: 50    }
    ];

    columns.forEach(function(col) {
        var check = new GlideRecord('sys_dictionary');
        check.addQuery('name',    TABLE_NAME);
        check.addQuery('element', col.element);
        check.query();
        if (check.next()) {
            log('Column already exists — skipping: ' + col.element, check.sys_id);
            return;
        }

        var gr = new GlideRecord('sys_dictionary');
        gr.initialize();
        gr.setValue('name',           TABLE_NAME);
        gr.setValue('element',        col.element);
        gr.setValue('column_label',   col.label);
        gr.setValue('internal_type',  col.type);
        gr.setValue('max_length',     col.max);
        gr.setValue('active',         true);
        setScopeFields(gr);
        var sysId = gr.insert();
        log('Column: ' + TABLE_NAME + '.' + col.element, sysId);
    });
})();


// ─────────────────────────────────────────────────────────────
// 7. SERVICE PORTAL WIDGET — moveworks_builder
// ─────────────────────────────────────────────────────────────
(function createWidget() {
    var check = new GlideRecord('sp_widget');
    check.addQuery('id', 'moveworks-builder');
    check.query();
    if (check.next()) {
        log('Widget already exists — skipping', check.sys_id);
        return;
    }

    var gr = new GlideRecord('sp_widget');
    gr.initialize();
    gr.setValue('name',        'Moveworks Object Builder');
    gr.setValue('id',          'moveworks-builder');
    gr.setValue('description', 'AI-powered Moveworks object builder using Claude API');
    gr.setValue('template',    '<div><!-- TODO: UI will be added after commit --></div>');
    gr.setValue('css',         '/* TODO: styles will be added after commit */');
    gr.setValue('client_script', '// TODO: client script will be added after commit');
    gr.setValue('script',      '// TODO: server script will be added after commit');
    setScopeFields(gr);
    var sysId = gr.insert();
    log('Widget: moveworks-builder', sysId);
})();


// ─────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────
gs.info('');
gs.info('========================================');
gs.info('  MOVEWORKS BUILDER — SETUP COMPLETE');
gs.info('========================================');
results.forEach(function(r) { gs.info('  ✓ ' + r); });
gs.info('');
gs.info('NEXT STEPS:');
gs.info('  1. Open Studio → Moveworks Object Builder');
gs.info('  2. Source Control → Commit files to nowdev branch');
gs.info('  3. Share the new XML file names with Bob to fill in the logic');
gs.info('========================================');
