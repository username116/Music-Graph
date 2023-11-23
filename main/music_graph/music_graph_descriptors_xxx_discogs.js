'use strict';
//22/11/23

/*
	These are the variables of the music graph: nodes (styles and genres), links, link weighting (aka distance) and rendering settings.
	This file can be updated independently to the other files. i.e. the node/links coding (the actual graph creating) and the descriptors are separated.
	
	The music structure goes like this: Superclusters -> Clusters -> Supergenres -> Style clusters -> Styles (smallest nodes)
	Obviously, the left terms are groups of the right terms.
	
	That means every user can set its 'own map' according to their tags. Note your files MUST be tagged according to the descriptors,
	but you can add substitutions at style_substitutions.... that's the thing most users will have to configure according to their tag usage.
	Note the graph functions don't care whether the tag is a genre a style or whatever tag name you use. 'Rock is rock', wherever it is. 
	But that genre/style must be on music_graph_descriptors to be recognized.
	
	If you have new genres/styles not present on the graph then you probably need to add them to: 
		- style_supergenre: that places the genre on a main big genre... For ex. Britpop into Contemporary Rock.
		- style_cluster: that connects your new genre with related genres. For ex. R&B and Doo Wop are both in Vocal Pop style cluster.
		- Optional:
			- style_primary_origin: connects styles which are direct derivatives or origins. Farther than in the same style cluster.
			- style_secondary_origin: connects styles which are secondary derivatives or origins. Farther than previous one.
			- style_anti_influence: greatly distances two genres. It would be the opposite to being in the same style cluster.
	
	Now, let's say you have a group of related styles not present on the graph. For ex. Grunge Rock, Classic Grunge, etc. They are all 'grunge',
	so you should not put them into style_supergenre matrix, where grunge already exists. We would want to add even smaller nodes than that
	main genre. For that we use style_weak_substitutions, where we would put Grunge at the left, and connect it to Grunge Rock, Classic Grunge, etc.
	Other approach would be to use style_cluster. Use whatever you prefer according to the link 'distance' you want to add. Values at bottom.
		
	'map_distance_exclusions' have those genre/style tags which are not related to an specific musical style. 
	i.e. Acoustic could be heavy metal, rock or whatever... so we skip it (for other calcs).
	They are filtered because they have no representation on the graph, not being a real genre/style but a musical characteristic.
	So they are useful for similarity scoring purposes but not for the graph. 
	This filtering stage is not needed, but it greatly speedups the calculations if you have tons of files with these tags!
	This means than any tag not included in the graph will be omitted for calcs, but you save time if you add it manually to the exclusions (otherwise the entire graph will be visited to try to find a match).

	Then we got: Primary origins, secondary origins, weak substitutions, (direct) substitutions and anti-influences.
	The first 3 are links between styles related 'in some way'. (Direct) substitutions are equivalent  nodes (A = B), with 0 distance.
	Finally, anti-influence accounts for styles which are considered too different, even being of the same group (style cluster or supergenres).
	
	The function 'musicGraph()' creates the graph, and the same for the HTML counterpart (it adds colors and all that to the main graph).
	Execute 'Draw Graph.html' on your browser and it should load the graph set on this file. So whatever you edit here, it gets shown on the rendered version. 
	That's an easy way to see if you added nodes at a wrong place, things not linked, etc. Much easier than checking matrices and lists of strings!
	
	Finally, the function 'searchByDistance()' does all the calculations for similarity between tracks.
	
	Tests are also available with the buttons present on these scripts (customizable button and Playlist Tools).
*/
const music_graph_descriptors = {
	/*
		----------------------------------------------------------------------------------------------------
											Graph nodes and links											
		----------------------------------------------------------------------------------------------------
	*/
	/*
		-> Music & Supergenres clusters: Mega-Groups of related musical clusters. No need to usually touch these
	*/
	// Mega-Groups of related supergenre's groups: 4 big groups of popular music connected + the others
	style_supergenre_supercluster: [

	],
	// Groups of related Supergenres
	style_supergenre_cluster: [
		['Central cluster'					,	['Electronic_supergenre','Hip Hop_supergenre','Jazz_supergenre','Rock_supergenre','Reggae_supergenre','Latin_supergenre','Funk / Soul_supergenre','Blues_supergenre','Non-Music_supergenre','Pop_supergenre','Classical_supergenre','Brass & Military_supergenre','Children\u0027s_supergenre','Folk, World, & Country_supergenre','Stage & Screen_supergenre']]
	],
	/*
		-> SuperGenres: Mega-Groups of genres and styles. Users may want to edit these at the user's descriptor file
	*/
	// Here genres and styles are put into their main category. Like 'Progressive Rock' and 'Hard Rock' into 'Rock&Roll Supergenre'
	// This points to genre and styles which are considered to belong to the same parent musical genre, while not necessarily being
	// considered 'similar' in an 'listening session' sense. For ex. 'Space Rock' and 'Southern Rock' can be considered Rock but pretty
	// different when looking for Rock tracks. On the other hand, they are similar if you compare them to Jazz.
	style_supergenre: [
		['Electronic_supergenre',				['Techno','House','Trance','Trip Hop','Downtempo','Leftfield','Deep House','Tech House','Gabber','IDM','Ambient','Drum n Bass','Abstract','Acid','Acid House','Big Beat','Breakbeat','Breaks','Electro','Euro House','Experimental','Garage House','Goa Trance','Happy Hardcore','Hard Trance','Hardcore','Illbient','Jungle','Progressive House','Progressive Trance','Tribal','Tribal House','UK Garage','Future Jazz','Industrial','Synth-pop','Minimal','Jazzdance','Acid Jazz','Latin','Noise','Dub','Disco','New Beat','Hard House','Modern Classical','Hip Hop','Italo-Disco','Hi NRG','EBM','Breakcore','Hardstyle','Psy-Trance','Glitch','Ghetto','Broken Beat','Grime','Hip-House','Italodance','Makina','Musique Concrète','Neofolk','New Wave','Power Electronics','Rhythmic Noise','Speedcore','Freestyle','Speed Garage','Chiptune','Dubstep','Jumpstyle','Drone','Darkwave','Dub Techno','New Age','Dark Ambient','Berlin-School','Eurodance','Tech Trance','Donk','Doomcore','Electro House','Schranz','Hard Techno','Skweee','Minimal Techno','Bassline','Electroclash','Beatdown','Euro-Disco','Baltimore Club','Ghettotech','Ghetto House','Juke','Eurobeat','Vaporwave','Witch House','Italo House','Dance-pop','Funkot','Synthwave','Hands Up','Nu-Disco','Progressive Breaks','Sound Collage','Harsh Noise Wall','Ballroom','Chillwave','Tropical House','J-Core','Deep Techno','Neo Trance','Hard Beat','Disco Polo','Dungeon Synth','UK Funky','Lento Violento','Nerdcore Techno','Electroacoustic','Glitch Hop','Footwork','Bleep','Halftime','Jersey Club','Electro Swing','Moombahton','Freetekno','Balearic','Hyperpop','Rōkyoku','Gqom','Future Bass','Future House','French House','Ambient House','Dark Electro','Amapiano','Plunderphonics','Bitpop','Lowercase','Hyper Techno','Comfy Synth','Microhouse','Deconstructed Club','Bass Music']],
		['Hip Hop_supergenre',					['Gangsta','Conscious','Bass Music','Go-Go','Thug Rap','Cut-up/DJ','RnB/Swing','Ragga HipHop','Pop Rap','Screw','Bounce','Instrumental','Electro','Trip Hop','DJ Battle Tool','Kwaito','Crunk','Horrorcore','Hyphy','Grime','Britcore','Hardcore Hip-Hop','Bongo Flava','Hiplife','Spaza','Motswako','Jazzy Hip-Hop','Favela Funk','G-Funk','Trap','Miami Bass','Boom Bap','Turntablism','Beatbox','Cloud Rap','Phonk','Drill','Low Bap']],
		['Jazz_supergenre',						['Post Bop','Big Band','Swing','Bop','Free Jazz','Fusion','Contemporary Jazz','Smooth Jazz','Hard Bop','Modal','Latin Jazz','Afro-Cuban Jazz','Ragtime','Jazz-Funk','Jazz-Rock','Soul-Jazz','Dixieland','Space-Age','Easy Listening','Cool Jazz','Free Improvisation','Gypsy Jazz','Afrobeat','Bossa Nova','Avant-garde Jazz','Cape Jazz','Stride','Dark Jazz','Shidaiqu']],
		['Rock_supergenre',						['Industrial','Alternative Rock','Grunge','Goth Rock','Prog Rock','Funk Metal','Indie Rock','Emo','Math Rock','Punk','Hardcore','Blues Rock','Hard Rock','Thrash','Death Metal','Grindcore','Heavy Metal','Pop Rock','Oi','Space Rock','Nu Metal','Psychedelic Rock','Rock & Roll','Symphonic Rock','Ska','Garage Rock','Post Rock','Black Metal','Viking Metal','New Wave','Psychobilly','Rockabilly','Glam','Classic Rock','Noise','Lounge','Lo-Fi','Arena Rock','Folk Rock','Speed Metal','Mod','Soft Rock','Doom Metal','Avantgarde','Art Rock','Country Rock','Southern Rock','Neofolk','Acoustic','Stoner Rock','Parody','Surf','Power Pop','Ethereal','Doo Wop','Skiffle','Experimental','Shoegaze','Post-Punk','Beat','Acid Rock','No Wave','Sludge Metal','Power Metal','Folk Metal','Gothic Metal','Metalcore','Pop Punk','Swamp Pop','Deathrock','Pub Rock','Melodic Hardcore','Crust','Krautrock','Progressive Metal','Post-Hardcore','Melodic Death Metal','AOR','Coldwave','Deathcore','Goregrind','Post-Metal','Funeral Doom Metal','Rock Opera','NDW','Power Violence','Depressive Black Metal','Noisecore','Dream Pop','Pornogrind','Yé-Yé','Twist','Technical Death Metal','Atmospheric Black Metal','Horror Rock','J-Rock','K-Rock','Jangle Pop','Industrial Metal','Groove Metal','Symphonic Metal','Britpop','Group Sounds','Baroque Pop','Slowcore','Blackgaze','Nintendocore','Alternative Metal','Noise Rock','Unblack Metal','Crossover thrash','Post-Grunge','Mathcore']],
		['Reggae_supergenre',					['Mento','Ska','Rocksteady','Reggae','Reggae-Pop','Reggae Gospel','Roots Reggae','Lovers Rock','Dub','Dancehall','Ragga','Steel Band','Junkanoo','Calypso','Rapso','Dub Poetry','Soca','Bubbling','Azonto']],
		['Latin_supergenre',					['Bachata','Batucada','Beguine','Bolero','Boogaloo','Bossanova','Cha-Cha','Charanga','Compas','Conjunto','Corrido','Cuatro','Cubano','Cumbia','Danzon','Guaguancó','Jibaro','Lambada','Norteño','Nueva Cancion','Mambo','Mariachi','Marimba','Merengue','Nueva Trova','Pachanga','Plena','Quechua','Ranchera','Reggaeton','Rumba','Samba','Salsa','Son','Sonero','Tango','Tejano','Timba','Trova','Vallenato','Descarga','MPB','Afro-Cuban','Axé','Guaracha','Forró','Porro','Guajira','Son Montuno','Joropo','Champeta','Candombe','Occitan','Música Criolla','Choro','Seresta','Samba-Canção','Baião','Marcha Carnavalesca','Bomba','Gaita','Carimbó','Aguinaldo','Bambuco','Frevo','Banda']],
		['Funk / Soul_supergenre',				['Funk','Soul','Rhythm & Blues','Gospel','Bayou Funk','Psychedelic','P.Funk','Free Funk','New Jack Swing','Neo Soul','Disco','Gogo','Swingbeat','Afrobeat','Contemporary R&B','Boogie','Minneapolis Sound','UK Street Soul','Doo Wop']],
		['Blues_supergenre',					['Chicago Blues','Country Blues','Delta Blues','East Coast Blues','Harmonica Blues','Louisiana Blues','Modern Electric Blues','Texas Blues','Electric Blues','Jump Blues','Piano Blues','Piedmont Blues','Rhythm & Blues','Boogie Woogie','Memphis Blues','Hill Country Blues']],
		['Non-Music_supergenre',				['Spoken Word','Interview','Audiobook','Radioplay','Monolog','Dialogue','Comedy','Field Recording','Special Effects','Movie Effects','Therapy','Education','Speech','Sermon','Political','Religious','Promotional','Technical','Public Service Announcement','Poetry','Public Broadcast','Sound Poetry','Sound Art','Health-Fitness','Erotic','Medical','Occult']],
		['Pop_supergenre',						['Europop','Schlager','Ballad','Chanson','Music Hall','Vocal','Novelty','J-pop','Enka','Karaoke','Parody','Bollywood','Indie Pop','Bubblegum','Kayōkyoku','Light Music','Break-In','Barbershop','K-pop','Néo Kyma','Levenslied','Ethno-pop','City Pop','Cantopop','Mandopop','Hokkien Pop','Villancicos','Indo-Pop','Ryūkōka','V-pop','Russian Pop','Latin Pop','Exotica','Musette','Holiday','Hypnagogic pop','Zhongguo Feng','Sunshine Pop','Alt-Pop','Anison','Future Pop']],
		['Classical_supergenre',				['Early','Renaissance','Baroque','Classical','Romantic','Neo-Classical','Neo-Romantic','Modern','Post-Modern','Contemporary','Medieval','Twelve-tone','Serial','Impressionist','Opera','Operetta','Choral','Zarzuela','Oratorio','Organ']],
		['Brass & Military_supergenre',			['Marches','Military','Pipe & Drum','Brass Band','Guggenmusik']],
		['Children\u0027s_supergenre',			['Story', 'Nursery Rhymes', 'Educational']],
		['Folk, World, & Country_supergenre',	['Country','Cajun','Zydeco','Zouk','Folk','Bluegrass','Honky Tonk','Highlife','Klezmer','Laïkó','Polka','Hindustani','Carnatic','Sephardic','Mizrahi','Rebetiko','Canzone Napoletana','Gamelan','Raï','Bhangra','Overtone Singing','Mouth Music','Nordic','Celtic','African','Pacific','Éntekhno','Fado','Romani','Soukous','Sámi Music','Rune Singing','Aboriginal','Luk Thung','Kaseko','Klasik','Andalusian Classical','Mugham','Bangladeshi Classical','Cambodian Classical','Chinese Classical','Indian Classical','Persian Classical','Gagaku','Korean Court Music','Lao Music','Griot','Ottoman Classical','Philippine Classical','Piobaireachd','Thai Classical','Gospel','Phleng Phuea Chiwit','Hillbilly','Min\u0027yō','Western Swing','Luk Krung','Volksmusik','Sea Shanties','Guarania','Mbalax','Keroncong','Séga','Catalan Music','Népzene','Chamamé','Kizomba','Maloya','Zamba','Chacarera','Funaná','Jota','Pasodoble','Basque Music','Flamenco','Copla','Zemer Ivri','Yemenite Jewish','Liscio','Salegy','Appalachian Music','Hawaiian','Waiata','Dangdut','Bengali Music','Cobla','Chutney','Progressive Bluegrass','Filk','Qawwali','Ghazal','Cretan','Andean Music','Jug Band','Taarab','Għana','Mo Lam','Nhạc Vàng','Gwo Ka','Tamil Film Music','Morna','Huayno','Galician Traditional','Trallalero','Sean-nós','Singeli','Spirituals','Shaabi','Kuduro','Milonga','Sertanejo','Caipira','Geet','Neopagan','Gusle','Izvorna','Bakersfield Sound','Cantorial','Honkyoku','Shomyo','Sankyoku','Jiuta','Sokyoku','Shinkyoku','Currulao','Ojkača','Kolo']],
		['Stage & Screen_supergenre',			['Soundtrack','Score','Theme','Musical','Cabaret','Vaudeville','Video Game Music','Ballet']]
	],
	// Small groups of related genres and styles
	// This points to genre and styles which are usually considered pretty similar in an 'listening session' sense.
	// For ex. instead of adding sub-styles to other places, we can add them here
	style_cluster: [

	],
	/*
		-> Influences: Special relations between genres and styles. Like origins, derivatives or things considered 'anti-influences'. 
		Users may want to edit these at the user's descriptor file
	*/
	// Primary influence. For example one style being the origin of other.
	// For ex. 'Rockabilly' and 'Rockabilly revival'.
	style_primary_origin: [

	],
	// Secondary influence. For example one style being slightly influenced by another.
	style_secondary_origin: [

	],
	// Anti-influences. Styles so different that are considered to be heavily distanced, even if the belong to the same genre parent.
	// For ex. 'Americana' and 'British Folk-Rock' are both 'Folk' styles, but they are considered to be farther away than other 'Folk' styles.
	style_anti_influence: [

	],
	// These are genre/styles which should always apply the 'Anti-influences' filter in a listening session (see customizable button).
	// i.e. if  a 'Jazz' track is taken as reference, 'Jazz anti-influences' should always be filtered out, because they sound 
	// really bad together on the same listening session, even if the search of similar tracks is broadened a lot.
	style_anti_influences_conditional: [

	],
	/*
		-> Substitutions: for genres and styles considered to be almost equal or even strict substitutions. 
		Users may want to edit these at the user's descriptor file, specially to add their own substitutions
		to avoid re-tagging their files.
	*/
	// Genres or styles that are pretty similar but not exactly the same. Combinations must be added as multiple entries.
	// {A->[B,C]} EQUAL TO {A->B, A->C} BUT NOT INCLUDED {B->C}
	style_weak_substitutions: [

	],
	// Some big groups or clusters are equal to genres or styles 'in the classic sense', so these are direct connections for them:
	// ALWAYS PUT FIRST the genre at the graph, then -at the right- the one(s) expected to be found on tags.
	// Example: we tag files as 'Golden Age Rock' and/or '60s Rock' instead of 'Classic Rock' (the value at the graph), then
	// We would add this line:
	// ['Classic Rock XL'				,	['Golden Age Rock','6os Rock'	]],
	// Alternatively we could change this line:
	// ['Classic Rock XL'				,	['Classic Rock'					]],
	// to
	// ['Classic Rock XL'				,	['Classic Rock','Golden Age Rock','6os Rock']],
	style_substitutions: [

	],
	/*
		-> Filtering: this is mostly a list of folksonomy tags which are explicitly filtered. Any value not present 
		on 'style_supergenre' (at top) is skipped anyway for all purposes, so it's not a requisite but it makes 
		the search faster. Users may want to edit these at the user's descriptor file, specially if they have a lot
		of values on style or genre tags used for classification but not directly related to a genre or style. For ex:
		'Film Score', 'Soundtrack', 'Anime Music', ...
	*/
	// For graph filtering
	map_distance_exclusions: new Set([

	]),
	/*
		----------------------------------------------------------------------------------------------------
											Weighting, for Graph Creation									
				These are the weight values for graph links between styles(S) and genres(G)
		----------------------------------------------------------------------------------------------------
	*/
	/* 
		Direct: A -> B (weight applied x1)
		Direct connections should have bigger costs since they are not accumulative
	*/
	primary_origin: 185, //Primary origin / Derivative x1
	secondary_origin: 300, //Secondary origin / Derivative x1
	weak_substitutions: 20, //Almost equal x1
	/* 
		Indirect: A ->( Clusters )-> B (weight applied x2 or more)
		Note the weight is accumulative, so bigger clusters' weights add to the previous path cost
		Ex: Style A -> Supergenre -> Supergenre Cluster -> Supergenre -> Style B
	*/
	cluster: 42, //Related style / genre: Southern Rock(S) -> Heartland Rock(S)
	intra_supergenre: 100, //Traverse between the same supergenre(SG): Southern Rock(G) -> Classic Rock(SG) -> Hard Rock(G)
	supergenre_cluster: 50, //Traverse between the same supergenre group(SG): Classic Rock(SG) -> Rock(SGG) -> Punk (SG)
	supergenre_supercluster: 75, //Traverse between the same music group(MG): Rap(SGG)->Rhythm Music(MG)->R&B(SGG)
	/*
		Special:
	*/
	inter_supergenre: 200, //Traverse between different contiguous supergenres groups(SGG): Rock(SGG) -> Pop(SGG)
	inter_supergenre_supercluster: 300, //Traverse between different contiguous supergenres groups(SGG): Rock(SGG) -> Pop(SGG)
	substitutions: 0, //Direct connections (substitutions)
	/*
		Influences:
	*/
	anti_influence: 100, //backlash / anti-influence between two nodes (added directly to the total path distance): A -> ? -> B
	primary_origin_influence: -10, //primary origin-influence between two nodes (added directly to the total path distance): A -> ? -> B
	secondary_origin_influence: -5, //secondary origin-influence between two nodes (added directly to the total path distance): A -> ? -> B
	/*	
		Note on intra_supergenre:
		-------------------------
		Use that value as the 'basic' distance value for similar genre/styles: x3/2, x2, etc.
		Having in mind that the max distance between 2 points on the graph will probably be ~ x4-x5 that value.
		A lower value (cluster or 1/2) would only output the nearest or almost same genre/styles.
		-------------------------
		Note on anti_influence:
		-------------------------
		It applies to anything listed on style_anti_influence. Same logic than the rest.
		The value is added to the total distance calculated between 2 nodes. i.e. if Rock to Jazz had a distance of 300,
		if they had an anti-influence link, then the total distance would be 300 + 100 = 400. Being farther than before...
		-------------------------
		Note on primary_origin_influence (same applies to secondary_origin_influence):
		-------------------------
		It only applies to those nodes which have a primary origin link AND are in the same Supergenre (SG).
		Contrary to anti_influence which applies globally and only on nodes listed in its associated array.
		This is done to account for genres/styles which are nearer than others on the same Supergenre, 
		while not using a style cluster or weak substitution approach.
		Also beware of setting too high (absolute) values, the value is directly applied to the final total path distance...
		the idea is that cluster related nodes (85) should be nearer than intra-Supergenre related nodes (100). When adding a
		primary_origin link, then it would be omitted (being greater than the other two) but the influence applies.
		The total distance would be 85 - 10 = 75 for cluster related nodes and 100 - 10 = 90 for intra-Supergenre related nodes.
		But also when considering intra-Supergenre related nodes with primary_origin links (90) against cluster related nodes
		without such link (85) the cluster related ones are still neared than the others.
	*/
	/*
		----------------------------------------------------------------------------------------------------
													For drawing 											
				These are the weight values for graph links between styles(S) and genres(G)
		----------------------------------------------------------------------------------------------------
	*/
	// Assigns colors to labels and nodes
	// Anything named '..._supergenre' will be added to the html color label legend automatically.
	// If more than one '...Folk..._supergenre' or '...Classical..._supergenre' is found, then it will be skipped.
	// i.e. It will list Folk and Classical only once, even if there are multiple (sub)SuperGenres.
	map_colors: [	// Todo: use colorbrewer sequential palettes
		// Supergenres
		['Industrial_supergenre'				,'#e04103'],
		['Metal_supergenre'						,'#D88417'],
		['Rock & Roll_supergenre'				,'#F3C605'],
		['Classic Rock_supergenre'				,'#F3C605'],
		['Punk Rock_supergenre'					,'#F3C605'],
		['Alternative_supergenre'				,'#F3C605'],
		['Hardcore Punk_supergenre'				,'#F3C605'],
		['Contemporary_supergenre'				,'#F3C605'],
		['Pop_supergenre'						,'#F9FF03'],
		['Modern Folk_supergenre'				,'#D4F900'],
		['European Pre-Modern Folk_supergenre'	,'#D4F900'],
		['South American Folk_supergenre'		,'#D4F900'],
		['North American Folk_supergenre'		,'#D4F900'],
		['Nordic Folk_supergenre'				,'#D4F900'],
		['Celtic Folk_supergenre'				,'#D4F900'],
		['African Folk_supergenre'				,'#D4F900'],
		['Asian Folk_supergenre'				,'#D4F900'],
		['European Folk_supergenre'				,'#D4F900'],
		['South European Folk_supergenre'		,'#D4F900'],
		['Country_supergenre'					,'#8FA800'],
		['R&B_supergenre'						,'#2E5541'],
		['Blues_supergenre'						,'#006da8'],
		['Gospel_supergenre'					,'#005da1'],
		['Jazz_supergenre'						,'#2640ab'],
		['Jamaican_supergenre'					,'#540AC8'],
		['Rap_supergenre'						,'#8000A1'],
		['Breakbeat_supergenre'					,'#950610'],
		['Drum & Bass_supergenre'				,'#950610'],
		['Hardcore_supergenre'					,'#950610'],
		['Techno_supergenre'					,'#950610'],
		['House_supergenre'						,'#950610'],
		['Trance_supergenre'					,'#950610'],
		['Downtempo_supergenre'					,'#c00000'],
		['Classical Medieval Era_supergenre'	,'#adadad'],
		['Classical Renaissance Era_supergenre'	,'#adadad'],
		['Classical Baroque Era_supergenre'		,'#adadad'],
		['Classical Classical Era_supergenre'	,'#adadad'],
		['Classical Romantic Era_supergenre'	,'#adadad'],
		['Classical Modernist Era_supergenre'	,'#adadad'],
		['Japanese Classical_supergenre'		,'#adadad'],
		['Indian Classical_supergenre'			,'#adadad'],
		// Supergenre Clusters
		['Industrial_cluster'					,'#e04103'], // From here to the bottom, will not be added to the color label legend,
		['Metal_cluster'						,'#D88417'], // because the names don't have '..._supergenre'
		['Rock_cluster'							,'#F3C605'],
		['Pop_cluster'							,'#F9FF03'],
		['Country_cluster'						,'#8FA800'],
		['Folk_cluster'							,'#D4F900'],
		['R&B_cluster'							,'#2E5541'],
		['Blue_Note_cluster'					,'#006da8'],
		['Jamaican_cluster'						,'#540AC8'],
		['Rap_cluster'							,'#8000A1'],
		['Breakbeat Dance_cluster'				,'#950610'],
		['Four-to-the-floor Dance_cluster'		,'#950610'],
		['Downtempo_cluster'					,'#c00000'],
		['Classical Music_cluster'				,'#adadad'],
		// Supergenre SuperClusters	
		['Heavy Music_supercluster'				,'#D88417'],
		['Pop & Rock Music_supercluster'		,'#F9FF03'],
		['Rythm Music_supercluster'				,'#006da8'],
		['Electronic Music_supercluster'		,'#950610'],
		['Folk Music_supercluster'		 		,'#D4F900'],
		['Classical Music_supercluster'	 		,'#adadad'],
	],
	
	// Attributes for every node type
	nodeSize: 10,
	nodeShape: 'rect', //'circle','rect','star' or 'image'. 'Image' requires 'imageLink' data for every node on drawing function
	nodeImageLink: 'helpers-external/ngraph/html/images/Starv2.png',
	
	style_clusterSize: 20,
	style_clusterShape: 'star',
	style_clusterImageLink: 'helpers-external/ngraph/html/images/Star.png',
	
	style_supergenreSize: 15,
	style_supergenreShape: 'circle',
	style_supergenreImageLink: 'helpers-external/ngraph/html/images/Star.png',
	
	style_supergenre_clusterSize: 18,
	style_supergenre_clusterShape: 'circle',
	style_supergenre_clusterImageLink: 'helpers-external/ngraph/html/images/Star.png',
	
	style_supergenre_superclusterSize: 22,
	style_supergenre_superclusterShape: 'rect',
	style_supergenre_superclusterImageLink: 'helpers-external/ngraph/html/images/Star_color.png',
	
	// Other
	bPreRender: true, // (false) Renders graph on the fly on browsers or (true) pre-rendering (it may take some time while loading entire graph)
	renderMethod: 'realDistance'	// ('graph') Renders graph according to link centrality/gravity forces.
									// ('graphWeighted') uses the link's weight values at top to render similar distances to real ones, but also using link forces.
									// ('realDistance') uses the link's weight values at top to render real distances. Beware it will look really weird!
};

(function () {	// Clean non ASCII values
	const asciiRegEx = [[/[\u0300-\u036f]/g, ''], [/\u0142/g, 'l']];
	const asciify = (node) => {
		let asciiNode = node.normalize('NFD');
		asciiRegEx.forEach((rgex) => {asciiNode = asciiNode.replace(rgex[0], rgex[1]);});
		return asciiNode;
	};
	['style_supergenre_supercluster', 'style_supergenre_cluster', 'style_supergenre', 'style_cluster', 'style_primary_origin', 'style_secondary_origin', 'style_weak_substitutions', 'style_substitutions'].forEach((key) => {
		music_graph_descriptors[key].forEach((pair) => {
			if (!pair || !Array.isArray(pair) || pair.length !== 2) {return;}
			const parent = pair[0];
			const asciiParent = asciify(parent);
			if (asciiParent !== parent) {pair[0] = asciiParent;}
			const nodeList = pair[1];
			nodeList.forEach((node, j) => {
				const asciiNode = asciify(node);
				if (asciiNode !== node) {nodeList[j] = asciiNode;}
			});
		});
	});

	music_graph_descriptors.map_distance_exclusions.forEach((node, i, set) => {
		const asciiNode = asciify(node);
		if (asciiNode !== node) {set.add(asciiNode);}
	});
	
	music_graph_descriptors.map_colors.forEach((pair) => {
		const node = pair[0];
		const asciiNode = asciify(node);
		if (asciiNode !== node) {pair[0] = asciiNode;}
	});
})();