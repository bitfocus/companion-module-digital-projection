var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var crypto = require('crypto');
var debug;
var log;

/**
 * Companion instance class for the Panasonic Projectors.
 *
 * @extends instance_skel
 * @version 1.1.0
 * @since 1.0.0
 * @author Matt Foulks <mfoulks1@gmail.com>
 * @author Keith Rocheck <keith.rocheck@gmail.com>
 */
class instance extends instance_skel {

	/**
	 * Create an instance of a projector module.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.0.0
	 */
	constructor(system, id, config) {
		super(system, id, config);

		this.data = [];

		this.inputs = [
			{ id: '0', label: 'CVBS 1' },
			{ id: '1', label: 'CVBS 2' },
			{ id: '2', label: 'S-Video' },
			{ id: '3', label: 'Component' },
			{ id: '4', label: 'VGA' },
			{ id: '5', label: '3G-SDI' },
			{ id: '6', label: 'DVI' },
			{ id: '7', label: 'HDMI' },
			{ id: '8', label: 'Test Pattern' }
		];

		this.actions(); // export actions
	}

	/**
	 * Setup the actions.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @access public
	 * @since 1.0.0
	 */
	actions(system) {
		var actions = {};

		actions['projector_on'] = {
			label: 'Turn On Projector'
		};

		actions['projector_off'] = {
			label: 'Turn Off Projector'
		};

		actions['shutter_on'] = {
			label: 'Shutter The Projector'
		};

		actions['shutter_off'] = {
			label: 'Unshutter The Projector'
		};

		actions['input_source'] = {
			label: 'Change The Input Source',
			options: [
				{
					type: 'dropdown',
					label: 'Input Source',
					id: 'source',
					default: '0',
					choices: this.inputs
				}
			]
		};

		actions['save_mem'] = {
			label: 'Save lens preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'preset',
					default: '0',
					choices: [
						{id: '0', label: 'Preset A'},
						{id: '1', label: 'Preset B'},
						{id: '2', label: 'Preset C'},
						{id: '3', label: 'Preset D'},
						{id: '4', label: 'Preset E'},
						{id: '5', label: 'Preset F'},
						{id: '6', label: 'Preset G'},
						{id: '7', label: 'Preset H'},
						{id: '8', label: 'Preset I'},
						{id: '9', label: 'Preset J'}
					]
				}
			]
		};

		actions['recall_mem'] = {
			label: 'Recall a lens preset',
			options: [
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'preset',
					default: '0',
					choices: [
						{id: '0', label: 'Preset A'},
						{id: '1', label: 'Preset B'},
						{id: '2', label: 'Preset C'},
						{id: '3', label: 'Preset D'},
						{id: '4', label: 'Preset E'},
						{id: '5', label: 'Preset F'},
						{id: '6', label: 'Preset G'},
						{id: '7', label: 'Preset H'},
						{id: '8', label: 'Preset I'},
						{id: '9', label: 'Preset J'}
					]
				}
			]
		};

		this.setActions(actions);
	}

	/**
	 * Creates the configuration fields for web config.
	 *
	 * @returns {Array} the config fields
	 * @access public
	 * @since 1.0.0
	 */
	config_fields() {

		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will connect to any supported Digital Projections projector device.'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Projector IP',
				width: 10,
				regex: this.REGEX_IP
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Control Port',
				width: 2,
				default:"7000"
			}
		]
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy();
		}

		debug("destroy", this.id);
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	init() {
		debug = this.debug;
		log = this.log;
	}

	/**
	 * INTERNAL: use setup data to initalize the tcp socket object.
	 *
	 * @access protected
	 * @since 1.0.0
	 */
	 	init_tcp(cmd) {
		var receivebuffer = '';

		if (this.socket !== undefined) {
			this.socket.destroy();
			delete this.socket;
		}

		if (this.config.port === undefined) {
			this.config.port = 1024;
		}

		if (this.config.host) {
			this.socket = new tcp(this.config.host, this.config.port);

			this.socket.on('error', (err) => {
				debug("Network error", err);
				this.log('error',"Network error: " + err.message);
			});

			this.socket.on('connect', () => {
				debug("Connected");
				console.log("*"+cmd+"\r");
				this.socket.send("*"+cmd+"\r");
			});

			//this.socket.send(this.getToken(line.substring(12, 20)) + "\x30\x30" + cmd + "\x0d");
			// separate buffered stream into lines with responses
			this.socket.on('data', (chunk) => {
				var i = 0, line = '', offset = 0;
				receivebuffer += chunk;
				line = receivebuffer.toString();
				console.log(receivebuffer.toString());
			});
		}
	}


	/**
	 * Executes the provided action.
	 *
	 * @param {Object} action - the action to be executed
	 * @access public
	 * @since 1.0.0
	 */
	action(action) {
		var cmd;
		var opt = action.options;

		switch (action.action) {
			case 'projector_on':
				this.init_tcp("power = on");
				break;
			case 'projector_off':
				this.init_tcp("power = off");
				break;
			case 'shutter_on':
				this.init_tcp("shutter = on");
				break;
			case 'shutter_off':
				this.init_tcp("shutter = off");
				break;
			case 'input_source':
				this.init_tcp("input = "+opt.source);
				break;
			case 'recall_mem':
				this.init_tcp("lensmemory.recall = "+opt.preset);
				break;
			case 'save_mem':
				this.init_tcp("lensmemory.save = "+opt.preset);
				break;
		}

		if (cmd !== undefined) {

			if (this.socket !== undefined && this.socket.connected) {
				this.socket.send(cmd);
			}
			else {
				debug('Socket not connected :(');
			}
		}
	}

	/**
	 * INTERNAL: initialize feedbacks.
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initFeedbacks() {
		// feedbacks
		var feedbacks = {};

		feedbacks['input_bg'] = {
			label: 'Change background color by destination',
			description: 'If the input specified is in use by the output specified, change background color of the bank',
			options: [
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(0,0,0)
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(255,255,0)
				},
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: this.CHOICES_INPUTS
				},
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					default: '0',
					choices: this.CHOICES_OUTPUTS
				}
			],
			callback: (feedback, bank) => {
				if (true) {
					return {
						color: feedback.options.fg,
						bgcolor: feedback.options.bg
					};
				}
			}
		};

		feedbacks['selected_destination'] = {
			label: 'Change background color by selected destination',
			description: 'If the input specified is in use by the selected output specified, change background color of the bank',
			options: [
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(0,0,0)
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(255,255,0)
				},
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					default: '0',
					choices: this.CHOICES_OUTPUTS
				}
			],
			callback: (feedback, bank) => {
				if (parseInt(feedback.options.output) == this.selected) {
					return {
						color: feedback.options.fg,
						bgcolor: feedback.options.bg
					};
				}
			}
		};

		feedbacks['selected_source'] = {
			label: 'Change background color by route to selected destination',
			description: 'If the input specified is in use by the selected output specified, change background color of the bank',
			options: [
				{
					type: 'colorpicker',
					label: 'Foreground color',
					id: 'fg',
					default: this.rgb(0,0,0)
				},
				{
					type: 'colorpicker',
					label: 'Background color',
					id: 'bg',
					default: this.rgb(255,255,255)
				},
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: this.CHOICES_INPUTS
				}
			],
			callback: (feedback, bank) => {
				if (true) {
					return {
						color: feedback.options.fg,
						bgcolor: feedback.options.bg
					};
				}
			}
		};

		this.setFeedbackDefinitions(feedbacks);
	}

	/**
	 * INTERNAL: initialize variables.
	 *
	 * @access protected
	 * @since 1.0.0
	 */
	initVariables() {
		var variables = [];

		variables.push({
			label: 'Label of input ',
			name: 'input_'
		});
		this.setVariable('input_', "name");

		variables.push({
			label: 'Label of selected destination',
			name: 'selected_destination'
		});

		variables.push({
			label: 'Label of input routed to selection',
			name: 'selected_source'
		});

		this.setVariableDefinitions(variables);
	}

	/**
	 * Process an updated configuration array.
	 *
	 * @param {Object} config - the new configuration
	 * @access public
	 * @since 1.0.0
	 */
	updateConfig(config) {
		var resetConnection = false;
		
		if (this.config.host != config.host)
		{
			resetConnection = true;
		}

		this.config = config;

		if (resetConnection === true || this.socket === undefined) {
			this.init_tcp();
		}
	}
}
exports = module.exports = instance;