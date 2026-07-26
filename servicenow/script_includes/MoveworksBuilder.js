var MoveworksBuilder = Class.create();
MoveworksBuilder.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /**
     * Calls the Anthropic Claude API to build a Moveworks object.
     * @param {string} userRequest - The user's natural language request
     * @returns {string} JSON string of the generated Moveworks object
     */
    buildObject: function() {
        var userRequest = this.getParameter('sysparm_request');
        if (!gs.nil(userRequest)) {
            return this._callClaudeAPI(userRequest);
        }
        return JSON.stringify({ error: 'No request provided' });
    },

    _callClaudeAPI: function(userRequest) {
        try {
            var rm = new sn_ws.RESTMessageV2('Moveworks Claude API', 'Build Object');

            var prompt = this._buildPrompt(userRequest);
            var body = {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2048,
                system: 'You are a Moveworks object builder. Generate valid Moveworks JSON objects based on user requirements. Return only raw JSON, no explanations.',
                tools: [{
                    name: 'build_moveworks_object',
                    description: 'Builds and returns a valid Moveworks object as structured JSON.',
                    input_schema: {
                        type: 'object',
                        properties: {
                            id:          { type: 'string', description: 'Unique ID e.g. action.reset_password' },
                            name:        { type: 'string', description: 'Human readable name' },
                            type:        { type: 'string', enum: ['action', 'event', 'slot'] },
                            description: { type: 'string', description: 'What this object does' },
                            parameters:  {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name:        { type: 'string' },
                                        type:        { type: 'string' },
                                        description: { type: 'string' },
                                        required:    { type: 'boolean' }
                                    }
                                }
                            },
                            output: {
                                type: 'object',
                                properties: {
                                    type:        { type: 'string' },
                                    description: { type: 'string' }
                                }
                            }
                        },
                        required: ['id', 'name', 'type', 'description']
                    }
                }],
                tool_choice: { type: 'tool', name: 'build_moveworks_object' },
                messages: [{ role: 'user', content: prompt }]
            };

            rm.setRequestBody(JSON.stringify(body));
            var response = rm.execute();
            var responseBody = JSON.parse(response.getBody());

            // Extract tool_use block input (the structured Moveworks object)
            if (responseBody.content) {
                for (var i = 0; i < responseBody.content.length; i++) {
                    if (responseBody.content[i].type === 'tool_use') {
                        return JSON.stringify(responseBody.content[i].input);
                    }
                }
            }
            return JSON.stringify({ error: 'No tool_use block in response' });

        } catch (e) {
            gs.error('MoveworksBuilder._callClaudeAPI error: ' + e.message);
            return JSON.stringify({ error: e.message });
        }
    },

    _buildPrompt: function(userRequest) {
        return [
            '<role>',
            '  You are a Moveworks object builder. Generate a valid Moveworks JSON object.',
            '</role>',
            '<guidelines>',
            '  1. Always include: id, name, type, description',
            '  2. Use snake_case for all id values',
            '  3. Prefix IDs: action. / event. / slot.',
            '  4. For actions, always include parameters and output blocks',
            '</guidelines>',
            '<user_request>',
            userRequest,
            '</user_request>'
        ].join('\n');
    },

    /**
     * Saves a generated Moveworks object to the custom table.
     */
    saveObject: function() {
        var objJson  = this.getParameter('sysparm_object');
        var request  = this.getParameter('sysparm_request');

        try {
            var parsed = JSON.parse(objJson);
            var gr = new GlideRecord('x_mwb_mw_object');
            gr.initialize();
            gr.setValue('request',     request);
            gr.setValue('object_id',   parsed.id   || '');
            gr.setValue('object_name', parsed.name || '');
            gr.setValue('object_type', parsed.type || '');
            gr.setValue('object_json', objJson);
            gr.setValue('state',       'generated');
            var sysId = gr.insert();
            return JSON.stringify({ success: true, sys_id: sysId });
        } catch (e) {
            return JSON.stringify({ success: false, error: e.message });
        }
    },

    type: 'MoveworksBuilder'
});