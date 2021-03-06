
var
	_ = require('_'),
	ko = require('ko'),

	Utils = require('Common/Utils'),

	PgpStore = require('Stores/User/Pgp'),

	kn = require('Knoin/Knoin'),
	AbstractView = require('Knoin/AbstractView');

/**
 * @constructor
 * @extends AbstractView
 */
function AddOpenPgpKeyPopupView()
{
	AbstractView.call(this, 'Popups', 'PopupsAddOpenPgpKey');

	this.key = ko.observable('');
	this.key.error = ko.observable(false);
	this.key.focus = ko.observable(false);

	this.key.subscribe(function() {
		this.key.error(false);
	}, this);

	this.addOpenPgpKeyCommand = Utils.createCommand(this, function() {

		var
			count = 30,
			keyTrimmed = Utils.trim(this.key()),
			reg = /[\-]{3,6}BEGIN[\s]PGP[\s](PRIVATE|PUBLIC)[\s]KEY[\s]BLOCK[\-]{3,6}[\s\S]+?[\-]{3,6}END[\s]PGP[\s](PRIVATE|PUBLIC)[\s]KEY[\s]BLOCK[\-]{3,6}/gi,
			openpgpKeyring = PgpStore.openpgpKeyring;

		if (/[\n]/.test(keyTrimmed))
		{
			keyTrimmed = keyTrimmed.replace(/[\r]+/g, '').replace(/[\n]{2,}/g, '\n\n');
		}

		this.key.error('' === keyTrimmed);

		if (!openpgpKeyring || this.key.error())
		{
			return false;
		}

		var done = false;

		do
		{
			var match = reg.exec(keyTrimmed);
			if (match && 0 < count)
			{
				if (match[0] && match[1] && match[2] && match[1] === match[2])
				{
					if ('PRIVATE' === match[1])
					{
						openpgpKeyring.privateKeys.importKey(match[0]);
					}
					else if ('PUBLIC' === match[1])
					{
						openpgpKeyring.publicKeys.importKey(match[0]);
					}
				}

				count -= 1;
				done = false;
			}
			else
			{
				done = true;
			}
		}
		while (!done);

		openpgpKeyring.store();

		require('App/User').default.reloadOpenPgpKeys();
		Utils.delegateRun(this, 'cancelCommand');

		return true;
	});

	kn.constructorEnd(this);
}

kn.extendAsViewModel(['View/Popup/AddOpenPgpKey', 'PopupsAddOpenPgpKeyViewModel'], AddOpenPgpKeyPopupView);
_.extend(AddOpenPgpKeyPopupView.prototype, AbstractView.prototype);

AddOpenPgpKeyPopupView.prototype.clearPopup = function()
{
	this.key('');
	this.key.error(false);
};

AddOpenPgpKeyPopupView.prototype.onShow = function()
{
	this.clearPopup();
};

AddOpenPgpKeyPopupView.prototype.onShowWithDelay = function()
{
	this.key.focus(true);
};

module.exports = AddOpenPgpKeyPopupView;
