import { ajax } from 'discourse/lib/ajax';
import { popupAjaxError } from 'discourse/lib/ajax-error';

export default {
  actions: {
    enableSyntaxnet() {
       ajax("/type/enable-syntaxnet", {
         type: 'POST',
         data: {
           enabled: true,
         }
       }).then(function (result, error) {
         if (error) {
           popupAjaxError(error);
         }
       });
    }
  }
}
