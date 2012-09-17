/*
 * Memory experiment
 *
 * Doug Markant
 * June 2012
 *
 */

var LOGGING = true; // when true, output will also be printed to console
var TESTING = true; 

var MAX_TRIALS;
var MAX_RESTUDY_TRIALS;
if (TESTING) {
    MAX_TRIALS = 5;
    MAX_RESTUDY_TRIALS = 5;
};

var N_STIMULI = 96;
var N_TARGETS = 4;
var STIMULI_FILE = 'stimuli.txt';
var TARGETS_FILE = 'stimuli_targets.txt';
var STIMULI = [];
var TARGETS = [];
var INSTRUCTIONIMG = [];

var CATCH_ARROWS = ["<",">"];


/********************
* HTML snippets
********************/
var INSTRUCTIONS_INIT = [ "instructions-0.html",
                          "instructions-2.html" ];

var INSTRUCTIONS_DECISION = [ "instructions-decision.html",
                              "instructions-decision-2.html" ];

var INSTRUCTIONS_RESTUDY = [ "instructions-restudy.html" ];

var INSTRUCTIONS_TEST = [ "instructions-test.html" ];

var BACKGROUND_COLOR = "#555555";

var ALERT_MSG = "By leaving this page you opt out of the experiment and forgo any further earnings. Please confirm that this is what you meant to do.";


/********************
* reward settings
********************/
var BASE_PAYMENT = 1;
var BONUS_PER_POINT = .05;
var MAX_PAYMENT = N_STIMULI*BONUS_PER_POINT + BASE_PAYMENT;

var BASE_PAYMENT_STR = dollar_str(BASE_PAYMENT);
var BONUS_PER_POINT_STR = dollar_str(BONUS_PER_POINT);
var MAX_PAYMENT_STR = dollar_str(MAX_PAYMENT);



/********************
* timing
********************/
var DURATION_STUDY = 4000;
var DURATION_RESTUDY = 4000;
var DURATION_TEST = 6000;
var ITI_STUDY = 500;
var ITI_DECISION = 500;
var ITI_TEST = 500;
var CATCH_DELAY = 6000;
var DELAY_DECISION_PROMPT = 0;
var DELAY_DECISION = 2000;
var DURATION_STUDY_STR = String(DURATION_TEST/1000);


/********************
* trial codes
********************/
var DECISION_RESTUDY = 0;
var DECISION_FREQ = 1;
var NO_DECISION = -1;
var DECISION_NAMES = ["restudy", "frequency", "none"];
var PROMPTS = ["RESTUDY?",
               "FREQUENCY?"];


/********************
* response codes
********************/
var OLD_DEF = 0;
var OLD_PROB = 1;
var NEW_PROB = 2;
var NEW_DEF = 3;
var NO_RESP = -1;
var RESPONSES = ["old_def", "old_prob", "new_prob", "new_def", "no_resp"];



function Item(stimulusindex, targetindex, studied, studyindex, decisiontype, decisionindex, testindex) {
    /*
     * Generic object to record attributes and responses to stimuli
     */
    this.stimulusindex = stimulusindex;     
    this.stimulus = STIMULI[stimulusindex]; // url to image
    this.targetindex = targetindex;         // index of associate
    this.target = TARGETS[targetindex]; 
    this.studied = studied;                 // whether studied
    this.studyindex = studyindex;           // position during first study seq
    this.decisiontype = decisiontype;       // 0=restudy, 1=freq, -1=none
    this.decisionindex = decisionindex;     // trial presented during decision phase
    this.decisionresp = -1;                 
    this.restudied = false;         
    this.restudyindex = -1;
    this.testindex = testindex;             // position during test seq
    this.testresponse = -1;

    this.toJSON = function() {
        var obj = {};
        obj.targetindex = this.targetindex;
        obj.studied = this.studied;
        obj.studyindex = this.studyindex;
        obj.decisiontype = this.decisiontype;
        obj.decisionindex = this.decisionindex;
        obj.decisionresp = this.decisionresp;
        obj.restudied = this.restudied;
        obj.restudyindex = this.restudyindex;
        obj.testindex = this.testindex;
        obj.testresponse = this.testresponse;
        return JSON.stringify(obj);
    };
};



/*
 *
 * Main experiment object
 *
 */
var Experiment = function() {
    this.state = 0;
    this.counter = 0;

    this.begin = function() {
        stimindices = range(N_STIMULI);
        studieditems = range(N_STIMULI);

        // assign a target to each item
        targetindices = [];
        for (var i=0; i<N_STIMULI; i++) {
            targetindices.push( i%N_TARGETS );
        };
        targetindices = shuffle(targetindices);

        // of the studied items, assign a random order for studying 
        studyorder = shuffle(studieditems);

        // of the studied items, assign a different random order for decisions
        decisionorder = shuffle(studieditems);

        // assign a decision type, with every block of 
        // 8 having an equal number of both kinds of decision
        sz = 8;
        decisiontype = [];
        for(var i=0; i<(studieditems.length/sz); i++) {
            dt = shuffle([0,0,0,0,1,1,1,1]);
            decisiontype = decisiontype.concat( dt );
        };

        // create object for each item with all of these indices
        ITEMS = [];
        for (var i=0; i<N_STIMULI; i++) {
    
            studyindex = studyorder.indexOf(i);
            if (studyindex != -1) {
                studied = true;
            } else {
                studied = false;
            };

            decisionindex = decisionorder.indexOf(i);
            if (decisionindex != -1) {
                dectype = decisiontype[decisionindex];
            } else {
                dectype = -1;
            };

            ITEMS.push( new Item( i, targetindices[i], studied, studyindex, dectype, decisionindex, -1 ) );

        };

        exp.state = 0;
        exp.counter = 0;
        fcn = exp.agenda[exp.state][0];
        fcn();
    };

    this.proceed = function() {
        /*
         * Based on this.agenda, will either repeat the current
         * task or move on to the next function
         */
        exp.counter += 1;

        if (exp.counter == exp.agenda[exp.state][1]) {
            exp.state += 1;
            exp.counter = 0;
        }
        fcn = exp.agenda[exp.state][0];
        fcn();
    };

    this.instructions = function() { instr = new InstructionDeck( INSTRUCTIONS_INIT );};

    this.startexp = function() {
        if (TESTING != true) {
            startTask();
        };
        exp.proceed();
    };

    this.study = function() {
        showpage('study.html');
        settimestamp();
        setoutputprefix([subjid, "study"]);
        output("start_study_phase");
        studyphase = new StudyPhase();
    }

    this.instructions_predecision = function() { instr = new InstructionDeck( INSTRUCTIONS_DECISION ); };

    this.decision = function() {
        showpage('decision.html');
        settimestamp();
        setoutputprefix([subjid, "decision"]);
        output("start_decision_phase");
        decisionphase = new DecisionPhase();
    };

    this.instructions_prerestudy = function() { instr = new InstructionDeck( INSTRUCTIONS_RESTUDY ); };

    this.restudy = function() {
        showpage('study.html');
        settimestamp();
        setoutputprefix([subjid, "restudy"]);
        output("start_restudy_phase");
        res = new RestudyPhase();
    };

    this.instructions_pretest = function() { instr = new InstructionDeck( INSTRUCTIONS_TEST ); };

    this.test = function() {
        showpage('test.html');
        settimestamp();
        setoutputprefix([subjid, "test"]);
        output("start_test_phase");
        test = new TestPhase();
    };

    this.questionnaire = function() {
	window.onbeforeunload = function(){ };
        
        // find out how many responses were correct
        ncorrect = 0;
        for (var i=0; i < ITEMS.length; i++ ) {
            if (ITEMS[i].testresponse == ITEMS[i].targetindex) {
                ncorrect += 1;
            };
        };

        setoutputprefix([subjid]);
        showpage('questionnaire.html');

        output(["ncorrect", ncorrect]);
        output(["bonus", (BONUS_PER_POINT * ncorrect).toFixed(2)]);

        $('#ncorrect').html(String(ncorrect));
        $('#nstimuli').html(String(N_STIMULI));
        $('#bonus').html(String( (BONUS_PER_POINT * ncorrect).toFixed(2)) );

        $("#continue").click(function () {
            $('textarea').each( function(i, val) {
                    datastring = datastring.concat( "\n", this.id, ":",  this.value);
            });
            $('select').each( function(i, val) {
                    datastring = datastring.concat( "\n", this.id, ":",  this.value);
            });
            $('input').each( function(i, val) {
                    datastring = datastring.concat( "\n", this.id, ":",  this.value);
            });            
            insert_hidden_into_form(0, "subjid", subjid );
            insert_hidden_into_form(0, "data", datastring );
            $('form').submit();
        });
    };

    this.agenda = [[this.instructions, 1], 
                   [this.startexp, 1],
                   [this.study, 1],
                   [this.instructions_predecision, 1],
                   [this.decision, 1],
                   [this.instructions_prerestudy, 1],
                   [this.restudy, 1],
                   [this.instructions_pretest, 1],
                   [this.test, 1],
                   [this.questionnaire, 1]
                   ]
}
var exp = new Experiment();



/*
 *
 * Functions for each block of trials 
 *
 */
function InstructionDeck (screens) {
    /*
     * Generic function for a deck of instruction screens
     */
    settimestamp();
    var that = this;
    this.screens = screens;

    this.next = function() {
        var currentscreen = this.screens.splice(0,1)[0];
        showpage( currentscreen );
        output( currentscreen );

        if ( screens.length === 0 ) $('.continue').click(function() {
            that.exit();
        });
        else $('.continue').click( function() {
            that.next(); 
        });

    };

    this.exit = function() {
        exp.proceed();
    };

    this.next();
};

function StudyPhase () {
    var sequence = [];
    var index = 0;
    var that = this;
    var catchkey;
    var kp;
    var caught;

    this.next = function() {
        if (index == MAX_TRIALS) {
            that.exit();
        } else {
            output(["iti"]);
            $('#fix').html('+');            
            window.onkeydown = undefined;            
            $('#cue').css("visibility","hidden");
            $('#target').css('visibility',"hidden");
            
            that.to = setTimeout( function() { that.trial(); }, ITI_STUDY);
        };
    };

    this.trial = function() {
        item = sequence[index];

        output([item.stimulusindex]);

        $('#cue').html( item.stimulus );
        $('#target').html( item.target );
        $('#cue').css('visibility',"visible");
        $('#target').css('visibility',"visible");

        that.to = setTimeout( function() {
            index += 1;
            that.catcher();
        }, DURATION_STUDY);
    };

    this.catcher = function() {
        $('#cue').css("visibility","hidden");
        $('#target').css('visibility',"hidden");

        if (Math.random()<0.5) { 
            that.catchkey = 0;
        } else {
            that.catchkey = 1;
        };
        $('#fix').html( CATCH_ARROWS[that.catchkey] );

        window.onkeydown = that.directionkeypress;
        output(['catch','on']);

        that.to = setTimeout( function() {
            output(['catch','noresp']);
            that.next();
        }, CATCH_DELAY);
    };

    this.directionkeypress = function(event) {
        var keyID = event.keyIdentifier;
        var keyCode = event.keyCode;
        var correct = false;

        if ((keyCode==37 || keyID=="Left") && that.catchkey==0) {
            correct = true;
        } else if ((keyCode==39 || keyID=="Right") && that.catchkey==1) {
            correct = true;
        };

        if (correct) {
            clearTimeout(that.to);
            window.onkeydown = undefined;
            output(['catch','resp']);
            that.next();
        };
    };

    this.exit = function() {
        clearTimeout(that.to);
        exp.proceed();
    };

    // get the appropriate set of items in the right order
    for (var i=0; i<ITEMS.length; i++) {
        if (ITEMS[i].studied) {
            sequence[ ITEMS[i].studyindex ] = ITEMS[i];
        };
    };
    if (MAX_TRIALS == undefined) { MAX_TRIALS = sequence.length; };

    this.trial();
};

function DecisionPhase () {
    var sequence = [];
    var index = 0;
    var that = this;
    var display = 0;
    var item;

    this.toggledisplay = function() {
        if (display == 0) {
            newstate = "visible";
            display = 1;
        } else {
            newstate = "hidden";
            display = 0;
        };
        $('#response').css("visibility",newstate);
        $('#prompt').css('visibility',newstate);
        $('#cue').css("visibility",newstate);        
    };

    this.next = function() {
        if (index == MAX_TRIALS) {
            that.exit();
        } else {
            output(['iti']);
            that.toggledisplay();
            that.to = setTimeout( function() { that.nextprompt(); }, ITI_DECISION);
        };
    };

    this.nextprompt = function() {
        item = sequence[index];        
        $('#prompt').html( PROMPTS[ item.decisiontype ] );
        $('#prompt').css('visibility',"visible");
        output(['prompt','on']);

        that.to = setTimeout( function() { that.nextitem(); }, DELAY_DECISION_PROMPT);
    };

    this.nextitem = function() {
        item = sequence[index];        
        $('#cue').html( item.stimulus );
        $('#cue').css("visibility","visible");        
        
        output(['cue','on'])

        that.to = setTimeout( function() { that.trial(); }, DELAY_DECISION);
    };

    this.trial = function() {

        $('#slider').slider({ 
            value: randrange(0, 100),
            stop: function(event, ui) {
                resp = ui.value/100;
                item.decisionresp = resp;
                output([DECISION_NAMES[item.decisiontype], item.stimulusindex, resp]);
                index += 1;
                that.next();
            }
        });

        //$('#cue').html( item.stimulus );
        //$('#prompt').html( PROMPTS[ item.decisiontype ] );
        //output(['cue','on'])
        that.toggledisplay();

    };
    this.exit = function() { 
        clearTimeout(that.to);
        exp.proceed(); 
    };

    $('#response').css("visibility","hidden");
    
    // get the appropriate set of items in the right order
    for (var i=0; i<ITEMS.length; i++) {
        if (ITEMS[i].decisiontype!=-1) {
            sequence[ ITEMS[i].decisionindex ] = ITEMS[i];
        };
    };
    if (MAX_TRIALS == undefined) { MAX_TRIALS = sequence.length; };

    this.nextprompt();
};

function RestudyPhase() {
    var sequence = [];
    var index = 0;
    var that = this;

    this.next = function() {
        if (index == MAX_RESTUDY_TRIALS) {
            that.exit();
        } else {
            output(["iti"]);
            $('#fix').html('+');            
            window.onkeydown = undefined;                        
            $('#cue').css("visibility","hidden");
            $('#target').css('visibility',"hidden");
            setTimeout( function() { that.trial(); }, ITI_STUDY);
        };
    };

    this.trial = function() {
        item = sequence[index];

        output([item.stimulusindex]);

        $('#cue').html( item.stimulus );
        $('#target').html( item.target );
        $('#cue').css('visibility',"visible");
        $('#target').css('visibility',"visible");

        setTimeout( function() {
            index += 1;
            that.catcher();
        }, DURATION_STUDY);
    };

    this.catcher = function() {
        $('#cue').css("visibility","hidden");
        $('#target').css('visibility',"hidden");

        if (Math.random()<0.5) { 
            that.catchkey = 0;
        } else {
            that.catchkey = 1;
        };
        $('#fix').html( CATCH_ARROWS[that.catchkey] );

        window.onkeydown = that.directionkeypress;
        output(['catch','on']);

        that.to = setTimeout( function() {
            output(['catch','noresp']);
            that.next();
        }, CATCH_DELAY);
    };

    this.directionkeypress = function(event) {
        var keyID = event.keyIdentifier;
        var keyCode = event.keyCode;
        var correct = false;

        if ((keyCode==37 || keyID=="Left") && that.catchkey==0) {
            correct = true;
        } else if ((keyCode==39 || keyID=="Right") && that.catchkey==1) {
            correct = true;
        };

        if (correct) {
            clearTimeout(that.to);
            window.onkeydown = undefined;                                    
            output(['catch','resp']);
            that.next();
        };
    };

    this.exit = function() {
        exp.proceed();
    };

    // get the responses on the previous decision
    // - for frequency items, divide into random halves
    // - for restudy items, divide according to response
    surfacedec = [];
    restudydec = [];
    restudyresp = [];
    for (var i=0, l=ITEMS.length; i < l; i++) {
        if (ITEMS[i].studied) {
            it = ITEMS[i];

            if (TESTING) {
                it.decisionresp = Math.random();
            };

            if (it.decisiontype == DECISION_RESTUDY) {
                restudydec.push( it );
            } else if (it.decisiontype == DECISION_FREQ) {
                surfacedec.push( it );   
            };
        };
    };

    // for restudy decisions, get random subsets after dividing based on response
    restudysort = restudydec.sort( function(a,b) { return a.decisionresp - b.decisionresp } );
    var l = restudysort.length;

    shuffled = shuffle(restudysort.slice(0,l/2)); // low rated items
    restudyitems = shuffled.slice(0,l/4);
    norestudyitems = shuffled.slice(l/4,l/2);
    
    shuffled = shuffle(restudysort.slice(l/2,l)); // high rated items
    restudyitems = restudyitems.concat( shuffled.slice(0,l/4) );
    norestudyitems = norestudyitems.concat( shuffled.slice(l/4,l/2) );
    
    // for surface decisions, just randomize the order
    surfacedec = shuffle(surfacedec);
    
    // for every mini-block of 8, have four of each kind
    sz = 4;
    sequence = []
    for(var i=0; i<(restudyitems.length/(sz)); i++) {
        subseq = [].concat( restudyitems.slice(i*sz,(i*sz)+sz), surfacedec.slice(i*sz,(i*sz)+sz) );
        subseq = shuffle(subseq);
        sequence = sequence.concat( subseq );
    };

    for(var i=0, l=sequence.length; i < l; i++) {
        sequence[i].restudied = true;
        sequence[i].restudyindex = i;
    };

    if (MAX_RESTUDY_TRIALS == undefined) { MAX_RESTUDY_TRIALS = sequence.length; };

    this.trial();
};

function TestPhase() {
    var sequence = [];
    var trial = 0;
    var that = this;
    var display = 0;
    var active = true;
    var item;
    
    this.to = null;

    this.toggledisplay = function() {
        if (display == 0) {
            newstate = "visible";
            display = 1;
        } else {
            newstate = "hidden";
            display = 0;
        };
        $('#stimulus-test').css("visibility",newstate);        
    };

    this.next = function() {
        trial += 1;

        if (trial == MAX_TRIALS) {
            that.exit();
        } else {
            output(["iti"]);
            $('#stimulus-test').css("visibility","hidden");        
            display = 0;
            setTimeout( function() { that.trial(); }, ITI_TEST);
        };

    };

    this.trial = function() {
        item = sequence[trial];
        $('#cue').html( item.stimulus );
        $('#stimulus-test').css("visibility","visible");        
        output(['cue','on']);

        that.to = setTimeout( function() { that.next(); }, DURATION_TEST);
    };

    this.exit = function() { 
        clearTimeout(that.to);

        // dump all the item data
        setoutputprefix([subjid, "item"]);
        for (var i=0; i<N_STIMULI; i++) {
            output([i, ITEMS[i].toJSON()]);
        };
        
        exp.proceed(); 
    };
   
    //****
    // if testing, randomly simulate if items were restudied 
    if (TESTING) {
        if (MAX_TRIALS < N_STIMULI/2) {
            for (var i=0; i<N_STIMULI; i++) {
                if (Math.random()<0.5) { ITEMS[i].restudied = true; };
            };
        };
    }
    //****

    // this divides up items based on decision type and whether restudied
    grps = [[],[],[],[]];
    for (var i=0; i<N_STIMULI; i++) {
        if (ITEMS[i].decisiontype == DECISION_RESTUDY) {
            if (ITEMS[i].restudied) {
                grps[0].push( ITEMS[i] );
            } else {
                grps[1].push( ITEMS[i] );
            };
        } else {
            if (ITEMS[i].restudied) {
                grps[2].push( ITEMS[i] );
            } else {
                grps[3].push( ITEMS[i] );
            };
        };
    };

    for (var i=0; i<grps.length; i++) { grps[i] = shuffle(grps[i]) };
    
    // this makes pseudo-random ordering
    sz = 2;
    sequence = [];
    for(var i=0; i<(N_STIMULI/(4*sz)); i++) {
        subseq = [];
        for (var j=0; j<grps.length; j++) {
            subseq = subseq.concat( grps[j].slice(i*sz,(i*sz)+sz) );
        };
        sequence = sequence.concat( shuffle(subseq) );
    };

    for (var i=0; i<sequence.length; i++) {
        sequence[i].testindex = i;
    };

    // insert target images
    $("#target1").html(TARGETS[0]);
    $("#target2").html(TARGETS[1]);
    $("#target3").html(TARGETS[2]);
    $("#target4").html(TARGETS[3]);
    
    // set up click handlers
    for (var i=0, l=TARGETS.length; i < l; i++) {
        $("#target"+String(i+1)).on("click", function(event) {
            clearTimeout(that.to);
            resp = Number(this.id[6])-1;
            item.testresponse = resp;
            output([item.stimulusindex, resp ]);
            that.next();
        });
    };
    if (MAX_TRIALS == undefined) { MAX_TRIALS = sequence.length; };

    this.trial();
};




/*
 *
 * Initiate
 *
 */
var startTask = function (alertmsg) {
	$.ajax("inexp", {
			type: "POST",
			async: true,
			data: {subjId: subjid}
	});

	// Provide opt-out 
	window.onbeforeunload = function(){
    	$.ajax("quitter", {
    			type: "POST",
    			async: false,
    			data: {subjId: subjid, dataString: datastring}
    	});
        log( "trying to leave" );
	alert( ALERT_MSG );
	return "Are you sure you want to leave the experiment?";
	};
};

