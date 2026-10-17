import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

const BUS_NAME = 'org.gnome.Mutter.DisplayConfig';
const OBJECT_PATH = '/org/gnome/Mutter/DisplayConfig';
const INTERFACE = 'org.gnome.Mutter.DisplayConfig';
const CURRENT_STATE_TYPE = new GLib.VariantType(
    '(ua((ssss)a(siiddada{sv})a{sv})a(iiduba(ssss)a{sv})a{sv})'
);

function getProperty(properties, name) {
    const value = properties[name];
    return value instanceof GLib.Variant ? value.deep_unpack() : value;
}

const RefreshRateToggle = GObject.registerClass(
class RefreshRateToggle extends QuickSettings.QuickToggle {
    _init() {
        super._init({
            title: _('High Refresh Rate'),
            iconName: 'preferences-desktop-display-symbolic',
            toggleMode: true,
        });

        this._changing = false;
        this._destroyed = false;
        this._cancellable = new Gio.Cancellable();
        this._clickedId = this.connect('clicked', () => this._setRefreshRate(this.checked));
        this._changedId = Gio.DBus.session.signal_subscribe(
            BUS_NAME,
            INTERFACE,
            'MonitorsChanged',
            OBJECT_PATH,
            null,
            Gio.DBusSignalFlags.NONE,
            () => {
                if (!this._changing && !this._destroyed)
                    this._sync();
            }
        );
        this._sync();
    }

    _call(method, parameters, replyType, callback) {
        Gio.DBus.session.call(
            BUS_NAME,
            OBJECT_PATH,
            INTERFACE,
            method,
            parameters,
            replyType,
            Gio.DBusCallFlags.NONE,
            -1,
            this._cancellable,
            callback
        );
    }

    _getCurrentState(callback) {
        this._call('GetCurrentState', null, CURRENT_STATE_TYPE, callback);
    }

    _sync() {
        this._getCurrentState((connection, result) => {
            if (this._destroyed)
                return;

            try {
                const [, monitors, logicalMonitors] = connection.call_finish(result).deep_unpack();

                let active = 0;
                let atMaximum = true;

                for (const logical of logicalMonitors) {
                    for (const [connector] of logical[5]) {
                        const monitor = monitors.find(item => item[0][0] === connector);
                        const mode = monitor?.[1].find(item => getProperty(item[6], 'is-current'));
                        if (!mode)
                            continue;
                        active++;
                        const maximum = Math.max(...monitor[1]
                            .filter(item => item[1] === mode[1] && item[2] === mode[2])
                            .map(item => item[3]));
                        if (mode[3] < maximum - 0.01)
                            atMaximum = false;
                    }
                }

                this.checked = active > 0 && atMaximum;
            } catch (error) {
                console.error(`Refresh Rate Quick Tile: ${error.message}`);
            }
        });
    }

    _setRefreshRate(high) {
        if (this._changing)
            return;

        this._changing = true;
        this._getCurrentState((connection, result) => {
            if (this._destroyed)
                return;

            try {
                const [serial, monitors, logicalMonitors, properties] =
                    connection.call_finish(result).deep_unpack();

                const updated = logicalMonitors.map(logical => {
                    const outputs = logical[5].map(([connector]) => {
                        const monitor = monitors.find(item => item[0][0] === connector);
                        if (!monitor)
                            return [connector, '', {}];

                        const activeMode = monitor[1].find(
                            mode => getProperty(mode[6], 'is-current')
                        );
                        const width = activeMode?.[1] ?? monitor[1][0]?.[1];
                        const height = activeMode?.[2] ?? monitor[1][0]?.[2];
                        const modes = monitor[1].filter(
                            mode => mode[1] === width && mode[2] === height
                        );
                        if (modes.length === 0)
                            return [connector, activeMode?.[0] ?? '', {}];

                        const target = modes.reduce((best, mode) => {
                            const isBetter = high
                                ? mode[3] > best[3]
                                : Math.abs(mode[3] - 60) < Math.abs(best[3] - 60);
                            return isBetter ? mode : best;
                        }, modes[0]);
                        const outputProperties = {};
                        const underscanning = getProperty(monitor[2], 'is-underscanning');
                        const colorMode = getProperty(monitor[2], 'color-mode');

                        if (underscanning !== undefined)
                            outputProperties.underscanning = new GLib.Variant('b', underscanning);
                        if (colorMode !== undefined)
                            outputProperties['color-mode'] = new GLib.Variant('u', colorMode);

                        return [connector, target?.[0] ?? activeMode?.[0] ?? '', outputProperties];
                    });

                    return [logical[0], logical[1], logical[2], logical[3], logical[4], outputs];
                });

                const configProperties = {};
                const layoutMode = getProperty(properties, 'layout-mode');
                const monitorsForLease = getProperty(properties, 'monitors-for-lease');
                if (layoutMode !== undefined)
                    configProperties['layout-mode'] = new GLib.Variant('u', layoutMode);
                if (monitorsForLease !== undefined)
                    configProperties['monitors-for-lease'] = new GLib.Variant(
                        'a(ssss)', monitorsForLease
                    );

                this._call(
                    'ApplyMonitorsConfig',
                    new GLib.Variant(
                        '(uua(iiduba(ssa{sv}))a{sv})',
                        [serial, 1, updated, configProperties]
                    ),
                    null,
                    (applyConnection, applyResult) => {
                        if (this._destroyed)
                            return;

                        try {
                            applyConnection.call_finish(applyResult);
                        } catch (error) {
                            console.error(`Refresh Rate Quick Tile: ${error.message}`);
                        }
                        this._changing = false;
                        this._sync();
                    }
                );
            } catch (error) {
                this._changing = false;
                this._sync();
                console.error(`Refresh Rate Quick Tile: ${error.message}`);
            }
        });
    }

    destroy() {
        this._destroyed = true;
        this._cancellable.cancel();
        this.disconnect(this._clickedId);
        Gio.DBus.session.signal_unsubscribe(this._changedId);
        super.destroy();
    }
});

export default class RefreshRateQuickTileExtension extends Extension {
    enable() {
        this._indicator = new QuickSettings.SystemIndicator();
        this._toggle = new RefreshRateToggle();
        this._indicator.quickSettingsItems.push(this._toggle);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._toggle.destroy();
        this._indicator.destroy();
        this._indicator = null;
        this._toggle = null;
    }
}
