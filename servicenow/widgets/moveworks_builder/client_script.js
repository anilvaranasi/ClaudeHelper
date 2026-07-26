function($http, $scope) {
    var c = this;
    c.data.loading    = false;
    c.data.error      = null;
    c.data.result     = null;
    c.data.resultJson = null;
    c.data.saved      = false;
    c.data.savedSysId = null;
    c.data.objectType = 'action';

    c.buildObject = function() {
        if (!c.data.userRequest) return;

        c.data.loading = true;
        c.data.error   = null;
        c.data.result  = null;
        c.data.saved   = false;

        // Append object type hint to request
        var fullRequest = c.data.userRequest;
        if (c.data.objectType) {
            fullRequest += ' (type: ' + c.data.objectType + ')';
        }

        c.server.get({
            action:      'buildObject',
            userRequest:  fullRequest
        }).then(function(response) {
            c.data.loading = false;
            if (response.data.error) {
                c.data.error = response.data.error;
                return;
            }
            try {
                c.data.result     = response.data.result;
                c.data.resultJson = JSON.stringify(c.data.result, null, 2);
            } catch (e) {
                c.data.error = 'Could not parse response: ' + e.message;
            }
        }, function(err) {
            c.data.loading = false;
            c.data.error   = 'Server error. Please try again.';
        });
    };

    c.saveObject = function() {
        c.server.get({
            action:     'saveObject',
            objectJson:  JSON.stringify(c.data.result),
            request:     c.data.userRequest
        }).then(function(response) {
            if (response.data.success) {
                c.data.saved      = true;
                c.data.savedSysId = response.data.sys_id;
            } else {
                c.data.error = 'Save failed: ' + response.data.error;
            }
        });
    };

    c.copyJson = function() {
        var el = document.createElement('textarea');
        el.value = c.data.resultJson;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    };

    c.reset = function() {
        c.data.result      = null;
        c.data.resultJson  = null;
        c.data.userRequest = '';
        c.data.error       = null;
        c.data.saved       = false;
    };
}