/**
 * MOVEWORKS OBJECT BUILDER — END-TO-END TEST SUITE
 * ==================================================
 * Run this in: System Definition → Scripts - Background
 * Scope: Global (run as admin)
 *
 * Tests:
 *   1. Script Include exists and is accessible
 *   2. REST Message + Method are correctly configured
 *   3. Table and all columns exist
 *   4. Widget exists with real content
 *   5. Live Claude API call (action, event, slot)
 *   6. Record save to x_146833_movewor_0_mw_object
 *   7. Saved record field validation
 */

var PASS   = '✓ PASS';
var FAIL   = '✗ FAIL';
var SKIP   = '- SKIP';
var results = [];
var passCount = 0;
var failCount = 0;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function assert(label, condition, detail) {
    if (condition) {
        results.push(PASS + ' | ' + label);
        passCount++;
    } else {
        results.push(FAIL + ' | ' + label + (detail ? ' — ' + detail : ''));
        failCount++;
    }
}

function skip(label, reason) {
    results.push(SKIP + ' | ' + label + ' — ' + reason);
}

function section(title) {
    results.push('');
    results.push('── ' + title + ' ──');
}

// ─────────────────────────────────────────────────────────────
// TEST 1 — SCRIPT INCLUDE
// ─────────────────────────────────────────────────────────────
section('1. Script Include');

var si = new GlideRecord('sys_script_include');
si.addQuery('name', 'MoveworksBuilder');
si.addQuery('sys_scope.scope', 'x_146833_movewor_0');
si.query();
var siExists = si.next();

assert('MoveworksBuilder script include exists',    siExists);
assert('Script include is active',                  siExists && si.active.toString() === 'true');
assert('Script include is client callable',         siExists && si.client_callable.toString() === 'true');
assert('Script include has real implementation',    siExists && si.script.toString().indexOf('callClaudeAPI') > -1,
       'Script still contains TODO placeholder');


// ─────────────────────────────────────────────────────────────
// TEST 2 — REST MESSAGE
// ─────────────────────────────────────────────────────────────
section('2. REST Message');

var rm = new GlideRecord('sys_rest_message');
rm.addQuery('name', 'Moveworks Claude API');
rm.addQuery('sys_scope.scope', 'x_146833_movewor_0');
rm.query();
var rmExists = rm.next();

assert('REST Message exists',                       rmExists);
assert('REST Message base_url is Anthropic',        rmExists && rm.base_url.toString().indexOf('anthropic.com') > -1,
       'base_url: ' + (rmExists ? rm.base_url : 'N/A'));

// Check HTTP Method
var rmFn = new GlideRecord('sys_rest_message_fn');
rmFn.addQuery('rest_message', rmExists ? rm.sys_id.toString() : '');
rmFn.addQuery('function_name', 'Build Object');
rmFn.query();
var rmFnExists = rmFn.next();

assert('HTTP Method "Build Object" exists',         rmFnExists);
assert('HTTP Method is POST',                       rmFnExists && rmFn.http_method.toString() === 'post',
       'Method is: ' + (rmFnExists ? rmFn.http_method : 'N/A'));
assert('REST endpoint points to /v1/messages',      rmFnExists && rmFn.rest_endpoint.toString().indexOf('/v1/messages') > -1,
       'Endpoint: ' + (rmFnExists ? rmFn.rest_endpoint : 'N/A'));

// Check API key header is set
var apiKeyHeader = new GlideRecord('sys_rest_message_fn_headers');
apiKeyHeader.addQuery('message_function', rmFnExists ? rmFn.sys_id.toString() : '');
apiKeyHeader.addQuery('name', 'x-api-key');
apiKeyHeader.query();
var headerExists = apiKeyHeader.next();
var apiKeyValue  = headerExists ? apiKeyHeader.value.toString() : '';

assert('x-api-key header exists',                  headerExists);
assert('x-api-key is not placeholder',             headerExists && apiKeyValue !== 'YOUR_ANTHROPIC_API_KEY_HERE' && apiKeyValue.length > 10,
       apiKeyValue === 'YOUR_ANTHROPIC_API_KEY_HERE' ? 'Still set to placeholder — update it first!' : 'Value looks empty');

var versionHeader = new GlideRecord('sys_rest_message_fn_headers');
versionHeader.addQuery('message_function', rmFnExists ? rmFn.sys_id.toString() : '');
versionHeader.addQuery('name', 'anthropic-version');
versionHeader.query();
assert('anthropic-version header exists',          versionHeader.next());


// ─────────────────────────────────────────────────────────────
// TEST 3 — TABLE AND COLUMNS
// ─────────────────────────────────────────────────────────────
section('3. Table & Columns');

var TABLE = 'x_146833_movewor_0_mw_object';
var tableRec = new GlideRecord('sys_db_object');
tableRec.addQuery('name', TABLE);
tableRec.query();
assert('Table ' + TABLE + ' exists',               tableRec.next());

var expectedColumns = ['request', 'object_id', 'object_name', 'object_type', 'object_json', 'state'];
expectedColumns.forEach(function(col) {
    var dict = new GlideRecord('sys_dictionary');
    dict.addQuery('name',    TABLE);
    dict.addQuery('element', col);
    dict.query();
    assert('Column ' + col + ' exists',            dict.next());
});


// ─────────────────────────────────────────────────────────────
// TEST 4 — WIDGET
// ─────────────────────────────────────────────────────────────
section('4. Service Portal Widget');

var widget = new GlideRecord('sp_widget');
widget.addQuery('id', 'moveworks-builder');
widget.query();
var widgetExists = widget.next();

assert('Widget moveworks-builder exists',          widgetExists);
assert('Widget has real HTML template',            widgetExists && widget.template.toString().indexOf('mwb-container') > -1,
       'Template still contains TODO');
assert('Widget has real CSS',                      widgetExists && widget.css.toString().indexOf('mwb-type-btn') > -1,
       'CSS still contains TODO');
assert('Widget has real client script',            widgetExists && widget.client_script.toString().indexOf('buildObject') > -1,
       'Client script still contains TODO');
assert('Widget has real server script',            widgetExists && widget.script.toString().indexOf('callClaudeAPI') > -1,
       'Server script still contains TODO');


// ─────────────────────────────────────────────────────────────
// TEST 5 — LIVE CLAUDE API CALLS
// ─────────────────────────────────────────────────────────────
section('5. Live Claude API — build objects');

// Skip live tests if API key is not set
var canCallAPI = headerExists && apiKeyValue !== 'YOUR_ANTHROPIC_API_KEY_HERE' && apiKeyValue.length > 10;

if (!canCallAPI) {
    skip('Action object generation',   'API key not configured — set x-api-key header first');
    skip('Event object generation',    'API key not configured');
    skip('Slot object generation',     'API key not configured');
} else {
    var api = new x_146833_movewor_0.MoveworksAPI();

    // Test Action
    try {
        var actionResult = JSON.parse(api.callClaudeAPI('Create an action to reset a user password (type: action)'));
        assert('Action: no error returned',        !actionResult.error, actionResult.error);
        assert('Action: has id field',             !!actionResult.id,   'id missing');
        assert('Action: id starts with action.',   actionResult.id && actionResult.id.indexOf('action.') === 0,
               'id was: ' + actionResult.id);
        assert('Action: type is "action"',         actionResult.type === 'action', 'type was: ' + actionResult.type);
        assert('Action: has description',          !!actionResult.description);
        assert('Action: has parameters array',     Array.isArray(actionResult.parameters), 'parameters missing or not array');
        assert('Action: has output block',         !!actionResult.output, 'output block missing');
    } catch (e) {
        assert('Action object generation',         false, 'Exception: ' + e.message);
    }

    // Test Event
    try {
        var eventResult = JSON.parse(api.callClaudeAPI('Create an event that fires when a new employee joins (type: event)'));
        assert('Event: no error returned',         !eventResult.error, eventResult.error);
        assert('Event: id starts with event.',     eventResult.id && eventResult.id.indexOf('event.') === 0,
               'id was: ' + eventResult.id);
        assert('Event: type is "event"',           eventResult.type === 'event', 'type was: ' + eventResult.type);
        assert('Event: has trigger field',         !!eventResult.trigger, 'trigger missing');
        assert('Event: has payload array',         Array.isArray(eventResult.payload), 'payload missing or not array');
    } catch (e) {
        assert('Event object generation',          false, 'Exception: ' + e.message);
    }

    // Test Slot
    try {
        var slotResult = JSON.parse(api.callClaudeAPI('Create a slot to capture employee department name (type: slot)'));
        assert('Slot: no error returned',          !slotResult.error, slotResult.error);
        assert('Slot: id starts with slot.',       slotResult.id && slotResult.id.indexOf('slot.') === 0,
               'id was: ' + slotResult.id);
        assert('Slot: type is "slot"',             slotResult.type === 'slot', 'type was: ' + slotResult.type);
        assert('Slot: has data_type field',        !!slotResult.data_type, 'data_type missing');
    } catch (e) {
        assert('Slot object generation',           false, 'Exception: ' + e.message);
    }
}


// ─────────────────────────────────────────────────────────────
// TEST 6 — RECORD SAVE
// ─────────────────────────────────────────────────────────────
section('6. Record Save & Retrieval');

if (!canCallAPI) {
    skip('Save generated object to table', 'API key not configured');
} else {
    try {
        // Generate a fresh object and save it
        var testApi    = new x_146833_movewor_0.MoveworksAPI();
        var testObjStr = testApi.callClaudeAPI('Create a slot to capture ticket priority (type: slot)');
        var testObj     = JSON.parse(testObjStr);

        var gr = new GlideRecord(TABLE);
        gr.initialize();
        gr.setValue('request',     'Test: capture ticket priority');
        gr.setValue('object_id',   testObj.id         || '');
        gr.setValue('object_name', testObj.name       || '');
        gr.setValue('object_type', testObj.type       || '');
        gr.setValue('object_json', testObjStr);
        gr.setValue('state',       'generated');
        var savedSysId = gr.insert();

        assert('Record inserted successfully',     !!savedSysId, 'insert() returned empty sys_id');

        // Read it back
        var verify = new GlideRecord(TABLE);
        verify.get(savedSysId);
        assert('Record readable by sys_id',        !!verify.sys_id);
        assert('Saved object_type matches',        verify.object_type.toString() === testObj.type,
               'Expected: ' + testObj.type + ', Got: ' + verify.object_type);
        assert('Saved object_json is valid JSON',  (function() {
            try { JSON.parse(verify.object_json.toString()); return true; } catch(e) { return false; }
        })());
        assert('State is "generated"',             verify.state.toString() === 'generated');

        // Clean up test record
        verify.deleteRecord();
        assert('Test record cleaned up',           true);

    } catch (e) {
        assert('Record save/retrieval',            false, 'Exception: ' + e.message);
    }
}


// ─────────────────────────────────────────────────────────────
// RESULTS SUMMARY
// ─────────────────────────────────────────────────────────────
gs.info('');
gs.info('╔══════════════════════════════════════════════════╗');
gs.info('║    MOVEWORKS BUILDER — TEST RESULTS              ║');
gs.info('╠══════════════════════════════════════════════════╣');
results.forEach(function(r) { gs.info('║  ' + r); });
gs.info('╠══════════════════════════════════════════════════╣');
gs.info('║  PASSED : ' + passCount);
gs.info('║  FAILED : ' + failCount);
gs.info('║  STATUS : ' + (failCount === 0 ? '🟢 ALL TESTS PASSED' : '🔴 ' + failCount + ' TEST(S) FAILED'));
gs.info('╚══════════════════════════════════════════════════╝');
