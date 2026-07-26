(function() {
    if (input) {
        var builder = new x_mwb.MoveworksBuilder();

        if (input.action === 'buildObject') {
            try {
                var ga = new GlideAjax('x_mwb.MoveworksBuilder');
                ga.addParam('sysparm_name',    'buildObject');
                ga.addParam('sysparm_request',  input.userRequest);
                // Direct server-side call (same scope)
                var result = builder._callClaudeAPI(input.userRequest);
                data.result = JSON.parse(result);
            } catch (e) {
                data.error = e.message;
            }
        }

        if (input.action === 'saveObject') {
            try {
                var gr = new GlideRecord('x_mwb_mw_object');
                var parsed = JSON.parse(input.objectJson);
                gr.initialize();
                gr.setValue('request',     input.request);
                gr.setValue('object_id',   parsed.id   || '');
                gr.setValue('object_name', parsed.name || '');
                gr.setValue('object_type', parsed.type || '');
                gr.setValue('object_json', input.objectJson);
                gr.setValue('state',       'generated');
                var sysId = gr.insert();
                data.success = true;
                data.sys_id  = sysId;
            } catch (e) {
                data.success = false;
                data.error   = e.message;
            }
        }
    }
})();