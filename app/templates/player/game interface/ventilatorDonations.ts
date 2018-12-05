import * as Handlebars from '../../../../node_modules/handlebars/dist/handlebars.js';

export const html = Handlebars.compile(`
  <div class="modal fade" id="mdlVenDon" tabindex="-1" role="dialog" aria-labelledby="mdlVenDonLabel" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Donation of ventilators</h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body" id = 'mdlVenDonBody'>
          <p class = "my-1 text-secondary">Antivirals:
            <label id = "lVenAvl">0</label> <!-- This should be parameterised -->
            <label class = "invisible" id = "lblInvVen"> 10000</label> <!-- This should be parameterised -->
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary">Confirm</button>
        </div>
      </div>
    </div>
  </div>
`);
