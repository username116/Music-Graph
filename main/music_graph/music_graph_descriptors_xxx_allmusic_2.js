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
		['Central cluster',     ['Classical','Country','Electronic','Folk','Jazz','Latin','New Age subgenres and styles','Rap','International','R&B','Reggae','Stage & Screen','Blues','Pop/Rock']],
	],
	// Groups of related Supergenres
	style_supergenre_cluster: [

	],
	/*
		-> SuperGenres: Mega-Groups of genres and styles. Users may want to edit these at the user's descriptor file
	*/
	// Here genres and styles are put into their main category. Like 'Progressive Rock' and 'Hard Rock' into 'Rock&Roll Supergenre'
	// This points to genre and styles which are considered to belong to the same parent musical genre, while not necessarily being
	// considered 'similar' in an 'listening session' sense. For ex. 'Space Rock' and 'Southern Rock' can be considered Rock but pretty
	// different when looking for Rock tracks. On the other hand, they are similar if you compare them to Jazz.
	style_supergenre: [
		['Classical',                           ['Avant-Garde Music','Ballet','Band Music','Chamber Music','Choral','Classical Crossover','Concerto','Electronic/Computer Music','Fight Songs','Film Score','Keyboard','Marches','Military','Miscellaneous (Classical)','Opera','Orchestral','Show/Musical','Symphony','Vocal Music']],
		['Country',                             ['Alternative Country','Contemporary Country','Country-Pop','Honky Tonk','Progressive Country','Traditional Country','Western Swing']],
		['Electronic',                          ['Downtempo','Electronica','Experimental Electronic','House','Jungle / Drum\u0027n\u0027Bass','Techno','Trance']],
		['Folk',                                ['Contemporary Folk','Traditional Folk']],
		['Jazz',                                ['Big Band / Swing','Bop','Contemporary Jazz','Cool','Free Jazz','Fusion','Global Jazz','Hard Bop','Jazz Instrument','New Orleans / Classic Jazz','Soul Jazz / Groove']],
		['Latin',                               ['Cuban Traditions','Latin America','Mexican Traditions','Tropical']],
		['New Age subgenres and styles',        ['New Age','Adult Alternative','Ambient','Contemporary Instrumental','Environmental','Ethnic Fusion','Flute/New Age','Guitar/New Age','Harp/New Age','Healing','Keyboard/Synthesizer/New Age','Meditation/Relaxation','Mystical Minimalism','Nature','Neo-Classical','New Age Tone Poems','Piano/New Age','Progressive Alternative','Progressive Electronic','Relaxation','Self-Help & Development','Solo Instrumental','Space','Spiritual','Techno-Tribal']],
		['Rap',                                 ['Alternative Rap','Hip-Hop/Urban','International Rap','Pop-Rap','Reggaeton/Latin Rap']],
		['International',                       ['African Traditions','Asian Traditions','Brazilian Traditions','Caribbean Traditions','Celtic/British Isles','Central African','Central American Traditions','Central European Traditions','Central/West Asian Traditions','Chinese Traditions','East African','Indian Subcontinent Traditions','Indonesian Traditions','Japanese Traditions','Jewish Music','Mediterranean Traditions','Middle Eastern Traditions','Nordic Traditions','North African','North American Traditions','North/East Asian Traditions','Oceanic Traditions','Russian Traditions','South American Traditions','South/Eastern European Traditions','Southeast Asian Traditions','Southern African','West African','Western European Traditions','Worldbeat']],
		['R&B',                                 ['Contemporary R&B','Early R&B','Soul']],
		['Reggae',                              ['Reggae','Bluebeat','Contemporary Reggae','Dancehall','DJ/Toasting','Dub','Dub Poetry','Lovers Rock','Nyahbinghi','Political Reggae','Ragga','Reggae-Pop','Rocksteady','Roots Reggae','Ska','Smooth Reggae','Sound System']],
		['Stage & Screen',                      ['Cast Recordings','Film Music','Sound Effects','Television Music']],
		['Blues',                               ['Chicago Blues','Country Blues','Delta Blues','Early Acoustic Blues','East Coast Blues','Electric Blues','Harmonica Blues','Jump Blues/Piano Blues','Louisiana Blues','Modern Acoustic Blues','Modern Electric Blues','Texas Blues']],
		['Pop/Rock',                            ['Alternative/Indie Rock','Art-Rock/Experimental','Asian Pop','Asian Rock','British Invasion','Dance','Europop','Folk/Country Rock','Foreign Language Rock','Hard Rock','Heavy Metal','Pop/Rock','Psychedelic/Garage','Punk/New Wave','Rock & Roll/Roots','Singer/Songwriter','Soft Rock']],

		['Alternative Country',                 ['Alt-Country','Americana']],
		['Contemporary Country',                ['Bro-Country','Contemporary Bluegrass','Country Rap','Neo-Traditionalist Country','New Traditionalist','Red Dirt']],
		['Country-Pop',                         ['Nashville Sound / Countrypolitan','Urban Cowboy']],
		['Honky Tonk',                          ['Bakersfield Sound','Truck Driving Country']],
		['Progressive Country',                 ['Country-Folk','Outlaw Country','Progressive Bluegrass','Rodeo']],
		['Traditional Country',                 ['Bluegrass','Bluegrass-Gospel','Close Harmony','Country Boogie','Country Gospel','Cowboy','Early Country','Instrumental Country','Jug Band','Old-Timey','Square Dance','String Bands','Traditional Bluegrass','Yodeling']],
		['Western Swing',                       ['Western Swing Revival']],
		['Downtempo',                           ['Ambient Dub','Dark Ambient','Downbeat','Experimental Ambient','Illbient','Synthwave','Trip-Hop','Vaporware']],
		['Electronica',                         ['Baile Funk','Big Beat','Breakcore','Clubjazz','EDM','Electronica','Funky Breaks','Hi-NRG','Newbeat','Nu Breaks','Trap (EDM)']],
		['Experimental Electronic',             ['Baseline','Chiptunes','Electro-Acoustic','Experimental Club','Experimental Dub','Glitch','IDM','Microsound']],
		['House',                               ['Acid House','Chicago House','Ambient House','Deep House','French House','Garage','Gqom','Jazz-House','Juke / Footwork','Left-Field House','Microhouse','Progressive House','Tech-House','Tribal House','UK Garage']],
		['Jungle / Drum\u0027n\u0027Bass',      ['Acid Jazz','Ambient Breakbeat','Broken Beat','Drill\u0027n\u0027bass','Dubstep','Experimental Jungle','Industrial Drum\u0027n\u0027Bass']],
		['Techno',                              ['Acid Techno','Ambient Techno','Detroit Techno','Electro','Electro-Jazz','Electro-Techno','Experimental Electro','Experimental Techno','Gabba','Happy Hardcore','Hardcore Techno','Minimal Techno','Neo-Electro','Rave','Techno Bass','Techno-Dub']],
		['Trance',                              ['Goa Trance','Progressive Trance','Psytrance']],
		['Contemporary Folk',                   ['Alternative Folk','Anti-Folk','Folk Jazz','Folk-Pop','Neo-Traditional Folk','New Acoustic','Political Folk','Progressive Folk','Urban Folk']],
		['Traditional Folk',                    ['Appalachian','British Folk','Field Recordings','Folk Revival','Folksongs','Irish Folk','Minstrel','Protest Songs','Sea Shanties','Work Song']],
		['Big Band / Swing',                    ['Ballroom Dance','Big Band','British Dance Bands','Continental Jazz','Dance Bands','Experimental Big Band','Jive','Modern Big Band','Orchestral Jazz','Progressive Big Band','Progressive Jazz','Society Dance Band','Sweet Bands','Swing']],
		['Bop',                                 ['Bop Vocals']],
		['Cool',                                ['Chamber Jazz','West Coast Jazz']],
		['Free Jazz',                           ['Avant-Garde Jazz','Early Creative','M-Base','Modern Creative','Modern Free','Third Stream']],
		['Fusion',                              ['Crossover Jazz','Electric Jazz','Free Funk','Jazz-Pop','Jazz-Rock','Modern Jazz','Smooth Jazz','Straight-Ahead Jazz']],
		['Global Jazz',                         ['African Jazz','Afro-Cuban Jazz','Brazilian Jazz','Cuban Jazz','Israeli Jazz','Latin Jazz']],
		['Hard Bop',                            ['Modal Music','Neo-Bop','Post-Bop']],
		['Jazz Instrument',                     ['Guitar Jazz','Piano Jazz','Saxophone Jazz','Trombone Jazz','Trumpet Jazz','Vibraphone / Marimba Jazz']],
		['New Orleans / Classic Jazz',          ['Boogie-Woogie','Chicago Jazz','Dixieland','Early Jazz','Hot Jazz','Mainstream Jazz','New Orleans Brass Bands','New Orleans Jazz','New Orleans Jazz Revival','Novelty Ragtime','Ragtime','Stride','Trad Jazz']],
		['Soul Jazz / Groove',                  ['Jazz-Funk','Jump Blues','Soul Jazz','Spiritual Jazz']],
		['Cuban Traditions',                    ['Afro-Cuban','Changui','Charanga','Danzon','Grupero','Guaguancó','Mambo','Modern Son','Nueva Trova','Rumba','Son','Timba']],
		['Latin America',                       ['Afro-Colombian','Alternative Latin','Bolero','Boogaloo','Cha-Cha','Choro','Colombian','Cuatro','Latin Big Band','Latin Dance','Latin Folk','Latin Pop','Latin Soul','New York Salsa','Nueva Cancion','Pachanga','Plena','Puerto Rican Traditions','Trova']],
		['Mexican Traditions',                  ['Alterna Movimiento','Alternative Corridos','Banda','Bomba','Conjunto','Corrido','Cumbia','Duranguense','Electro-Cumbia','Mariachi','Mexican-Cumbia','Narcocorridos','New Mexcio','Norteno','Onda Grupera','Ranchera','Sonidero']],
		['Tropical',                            ['Bachata','Beguine','Beguine Moderne','Beguine Vide','Compas','Cuban Pop','Dominican Traditions','Lambada','Merengue','Merenhouse','Mini Jazz','Salsa','Sonero']],
		['Alternative Rap',                     ['Afroswing','Cloud Rap','Grime','Instrumental Hip-Hop','Jazz-Rap','Left-Field Rap','Political Rap','Turntablism','Underground Rap']],
		['Hip-Hop/Urban',                       ['Dirty Rap','East Coast Rap','Golden Age','Hardcore Rap','Midwest Rap','Old-School Rap','West Coast Rap']],
		['International Rap',                   ['African Rap','Asian Rap','British Rap','Chinese Rap','European Rap','French Rap','German Rap','Italian Rap','Japanese Rap','Korean Rap','UK Drill']],
		['Pop-Rap',                             ['Bass Music','Bay Area Rap','Contemporary Rap','Dirty South','Drill','G-Funk','Gangsta Rap','Horror Rap','Party Rap','Southern Rap','Texas Rap','Trap (Rap)']],
		['Reggaeton/Latin Rap',                 ['Latin Rap','Reggaeton','Trap (Latin)','Urbano']],
		['African Traditions',                  ['African Folk','Afro-beat','Afro-Pop','Desert Blues']],
		['Asian Traditions',                    ['Asian Folk','Throat Singing']],
		['Brazilian Traditions',                ['Afoxe','Afro-Brazilian','Axe','Bossa Nova','Brazilian Folk','Brazilian Pop','Carnival','Forro','MPB','Samba','Tropicalia']],
		['Caribbean Traditions',                ['Bahamian','Belair','Cadence','Calypso','Chouval Bwa','French Antilles','Guadeloupe','Gwo Ka','Haitian','Jamaican','Junkanoo','Martinique','Mento','Party Soca','Rapso','Soca','Spouge','Steel Band','Trinidadian','Vaudou','Zouk']],
		['Celtic/British Isles',                ['Breton','British','Celtic','Celtic Folk','Celtic Fusion','Celtic Gospel','Celtic New Age','Celtic Pop','Celtic Rock','Contemporary Celtic','Country & Irish','Drinking Songs','Pibroch','Pipe Bands','Scottish Country Dance','Scottish Folk','Traditional Celtic','Traditional Irish Folk','Traditional Scottish Folk','Welsh']],
		['Central African',                     ['Burundi','Congolese','Kalindula','Mbuti Choral','Ndombolo','Pygmy','Soukous','Zairean']],
		['Central American Traditions',         ['Guatemalan','Honduran','Nicaraguan','Panamanian','Salvadoran']],
		['Central European Traditions',         ['Alpine','Austrian','Bava','Bavarian','Czech','German','Hungarian Folk','Moravian','Polish','Slovakian','Volksmusik']],
		['Central/West Asian Traditions',       ['Azerbaijani','Dagestani','Georgian','Georgian Choir','Kazakhstani','Tajik','Tibetan','Tuvan','Uzbekistani']],
		['Chinese Traditions',                  ['Chinese Classical','Traditional Chinese']],
		['East African',                        ['Benga','Bongo Flava','Ethiopian Pop','Kenyan','Mozambiquan','Omutibo','Somalian','Sudanese','Swahili','Taarab','Tanzanian','Ugandan']],
		['Indian Subcontinent Traditions',      ['Bangladeshi','Bengali','Bhangra','Bollywood','Carnatic','Dhrupad','Giddha','Indian','Indian Classical','Indian Pop','Nepalese','Pakistani','Qawwali','Raga']],
		['Indonesian Traditions',               ['Balinese','Gamelan','Jaipongan','Javanese','Kecak','Macapat Poetry','Sumatran']],
		['Japanese Traditions',                 ['Enka','Japanese Orchestral','Kabuki','Noh','Okinawan Traditional','Rakugo','Shinto','Traditional Japanese']],
		['Jewish Music',                        ['American Jewish Pop','Chassidic','Hebrew','Jewish Folk','Klezmer']],
		['Mediterranean Traditions',            ['Cretan','Dimotiko','Greek','Greek Folk','Greek-Pop','Laika','Nisiotika','Rembetika','Sardinian']],
		['Middle Eastern Traditions',           ['Afghanistan','Al-Jil','Apala','Arabic','Armenian','Armenian Folk','Belly Dancing','Egyptian','Iran-Classical','Iranian','Iraqi','Islamic','Israeli','Kurdish','Kuwaiti','Lebanese','Middle Eastern Pop','Palestinian','Persian','Saudi Arabian','Sha\'abi','Syrian','Traditional Middle Eastern Folk','Turkish','Yemenite']],
		['Nordic Traditions',                   ['Danish','Finnish Folk','Icelandic','Joik','Norwegian','Norwegian Folk','Sami','Scandinavian','Swedish Folk','Yodel']],
		['North African',                       ['Algerian','Berber','Mauritanian','Moroccan','Rai']],
		['North American Traditions',           ['Acadian','Cajun','Canadian','Contemporary Native American','Creole','Inuit','Native American','Quebecois','Traditional Native American','Zydeco']],
		['North/East Asian Traditions',         ['Korean','Mongolian','Siberian','Traditional Korean','Trot']],
		['Oceanic Traditions',                  ['Australasian','Australian','Hawaiian','Hawaiian Pop','Melanesian','Micronesian','New Zealand','Pacific Islands','Polynesian','Samoan','Slack-Key Guitar','Solomon Islands','Tahitian','Tongan']],
		['Russian Traditions',                  ['Russian Folk']],
		['South American Traditions',           ['Afro-Peruvian','Andean Folk','Argentinian Folk','Bolivian','Chilean','Ecuadorian','Frevo','Incan','Jibaro','Native South American','Paraguayan','Peruvian','Peruvian Folk','Quechua','Tango','Uruguayan','Vallenato','Venezuelan']],
		['South/Eastern European Traditions',   ['Albanian','Balkan','Baltic','Belarusian','Bosnian','Bulgarian','Bulgarian Folk','Croatian','Estonian','European Folk','Gypsy','Latvian','Macedonian','Moldavian','Mugam','Romanian','Serbian','Sharki','Slovenian','Traditional European Folk','Transylvanian','Ukrainian','Yugoslavian']],
		['Southeast Asian Traditions',          ['Bornean','Cambodian','Khmer Dance','Kulintang','Laotian','Malaysian','Myanmarian','Papua New Guinea','Philippine','Siamese','Thai','Vietnamese']],
		['Southern African',                    ['Southern African','Angolan','Chimurenga','Jit','Madagascan','Malawian','Marabi','Mbaqanga','Mbira','Mbube','Namibian','Séga','South African Folk','South African Pop','Township Jazz','Township Jive','Zambian','Zimbabwean','Zulu']],
		['West African',                        ['Bambara','Bikutsi','Cameroonian','Cape Verdean','Coupé-Décalé','Djabdong','French Guianese','Fuji','Gabonese','Gambian','Ghanaian','Guinea-Bissau','Guinean','Highlife','Ivorian','Juju','Kora','Makossa','Malian Music','Mbalax','Morna','Nigerian','Palm-Wine','Senegalese Music','Sierra Leonian','Yoruban']],
		['Western European Traditions',         ['Andalus Classical','Azorean','Basque','Belgian','Contemporary Flamenco','Dutch','Fado','Flamenco','French','French Chanson','French Folk','Italian Folk','Italian Music','Musette','Portuguese','Punta','Quadrille','Spanish Folk','Swiss Folk','Tyrolean']],
		['Worldbeat',                           ['Folk Dance','Folklore','International Folk','International Fusion','Neo-Traditional','Pan-Global']],
		['Contemporary R&B',                    ['Adult Contemporary R&B','Alternative R&B','Deep Funk Revival','Disco','Euro-Disco','Freestyle','Italo Disco','Neo-Soul','New Jack Swing','Post-Disco','Quiet Storm','Retro-Soul','Urban']],
		['Early R&B',                           ['Doo Wop','Motown','New Orleans R&B','R&B Instrumental']],
		['Soul',                                ['Beach','Blue-Eyed Soul','Brown-Eyed Soul','Chicago Soul','Country Soul','Deep Funk','Deep Soul','Funk','Go-Go','Memphis Soul','Northern Soul','Philly Soul','Pop-Soul','Psychedelic Soul','Smooth Soul','Southern Soul','Uptown Soul']],
		['Cast Recordings',                     ['Musical Theater','Musicals','Show Tunes']],
		['Film Music',                          ['Anime Music','Blaxploitation','Movie Themes','Original Score','Soundtracks','Spy Music']],
		['Sound Effects',                       ['Bird Calls','Occasion-Based Effects']],
		['Television Music',                    ['Cartoon Music','Library Music','Sports Anthems','TV Soundtracks','Video Game Music']],
		['Chicago Blues',                       ['Acoustic Chicago Blues','Chicago Blues','Electric Chicago Blues','Modern Electric Chicago Blues']],
		['Country Blues',                       ['Blues Gospel','Blues Revival','Folk-Blues','Memphis Blues','Pre-War Country Blues','Pre-War Gospel Blues','Songster','Vaudeville Blues','Work Songs']],
		['Delta Blues',                         ['Electric Delta Blues','Finger-Picked Guitar','Modern Delta Blues']],
		['Early Acoustic Blues',                ['Acoustic Blues','Acoustic Memphis Blues','Classic Blues Vocals','Classic Female Blues','Dirty Blues','Early American Blues','Piedmont Blues','Pre-War Blues','Regional Blues','Traditional Blues']],
		['East Coast Blues',                    ['New York Blues']],
		['Electric Blues',                      ['Detroit Blues','Electric Country Blues','Electric Harmonica Blues','Electric Memphis Blues','Juke Joint Blues','Slide Guitar Blues','Soul-Blues','Swamp Blues','Urban Blues']],
		['Jump Blues/Piano Blues',              ['Jazz Blues','Piano Blues','St. Louis Blues','West Coast Blues']],
		['Louisiana Blues',                     ['Acoustic Louisiana Blues','Acoustic New Orleans Blues','New Orleans Blues']],
		['Modern Electric Blues',               ['Contemporary Blues','Modern Blues']],
		['Texas Blues',                         ['Acoustic Texas Blues','Electric Texas Blues','Modern Electric Texas Blues']],
		['Alternative/Indie Rock',              ['Adult Alternative Pop/Rock','Alternative Country-Rock','Alternative Dance','Alternative Pop/Rock','Ambient Pop','American Underground','Bedroom Pop','British Trad Rock','Britpop','C-86','Chamber Pop','Chillwave','Cocktail','Cold Wave','College Rock','Cowpunk','Darkwave','Dream Pop','Electro-Industrial','Emo','Emo-Pop','Free Folk','Garage Punk','Garage Rock Revival','Goth Rock','Grunge','Grunge Revival','Indie Electronic','Indie Folk','Indie Pop','Indie Rock','Industrial','Industrial Dance','Jangle Pop','Left-Field Pop','Lo-Fi','Madchester','Math Rock','Neo-Disco','Neo-Glam','Neo-Psychedelia','New Wave/Post-Punk Revival','New Zealand Rock','Noise Pop','Paisley Underground','Pop Punk','Post-Grunge','Post-Hardcore','Post-Rock','Psychobilly','Punk Blues','Punk Revival','Queercore','Retro Swing','Riot Grrrl','Sadcore','Screamo','Shibuya-Kei','Shoegaze','Ska-Punk','Skatepunk','Slowcore','Sophisti-Pop','Space Rock','Third Wave Ska Revival','Twee Pop','Witch House']],
		['Art-Rock/Experimental',               ['Art Rock','Avant-Prog','Canterbury Scene','Experimental Rock','Kraut Rock','Neo-Prog','Noise-Rock','Prog-Rock']],
		['Asian Pop',                           ['C-Pop','Cantopop','City Pop','J-Pop','K-Pop','Kayokyoku','Mandopop','Okinawan Pop','Thai Pop']],
		['Asian Rock',                          ['Chinese Rock','Japanese Rock','Korean Rock','Visual Kei']],
		['British Invasion',                    ['British Blues','Early British Pop / Rock','Freakbeat','Merseybeat','Mod','Skiffle']],
		['Dance',                               ['Club/Dance','Dance-Pop','Dance-Rock','Euro-Dance','Exercise','Latin Freestyle','Teen Pop']],
		['Europop',                             ['Euro-Pop','Euro-Rock','Schlager','Swedish Pop/Rock']],
		['Folk/Country Rock',                   ['British Folk-Rock','Country-Rock','Folk-Rock']],
		['Foreign Language Rock',               ['Aboriginal Rock','AustroPop','Dutch Pop','Eastern European Pop','French Pop','French Rock','Indipop','International Pop','Italian Pop','Liedermacher','Nouvelle Chanson','Rock en Español','Scandinavian Pop','Yé-yé']],
		['Hard Rock',                           ['Album Rock','Arena Rock','Aussie Rock','Boogie Rock','Detroit Rock','Glam Rock','Glitter','Southern Rock','Rap-Rock']],
		['Heavy Metal',                         ['Alternative Metal','Avant-Garde Metal','Black Metal','Blackgaze','British Alternative Metal','Death Alternative Metal','Deathcore','Doom Alternative Metal','Drone Alternative Metal','Electronicore','Folk-Alternative Metal','Funk Alternative Metal','Goth Alternative Metal','Grindcore','Guitar Virtuoso','Hair Alternative Metal','Industrial Alternative Metal','Alternative Metalcore','Neo-Classical Alternative Metal','New Wave of British Heavy Alternative Metal','Nü Alternative Metal','Pop-Alternative Metal','Post-Alternative Metal','Power Alternative Metal','Progressive Alternative Metal','Punk Alternative Metal','Rap-Alternative Metal','Scandinavian Alternative Metal','Sludge Alternative Metal','Speed / Thrash Alternative Metal','Stoner Alternative Metal','Symphonic Black Alternative Metal','Symphonic Alternative Metal','Technical Death Alternative Metal']],
		['Pop/Rock',                            ['AM Pop','Baroque Pop','Brill Building Pop','Bubblegum','Celebrity','Contemporary Pop/Rock','Early Pop/Rock','Girl Groups','Pop','Pop Idol','Social Media Pop','Sunshine Pop','Teen Idols','Tribute Albums']],
		['Psychedelic/Garage',                  ['Acid Folk','Acid Rock','African Psychedelia','Asian Psychedelia','British Psychedelia','European Psychedelia','Garage Rock','Latin Psychedelia','Obscuro','Psychedelic','Psychedelic Pop','Turkish Psychedelia']],
		['Punk/New Wave',                       ['American Punk','Anarchist Punk','British Punk','Hardcore Punk','L.A. Punk','Mod Revival','New Romantic','New Wave','New York Punk','No Wave','Oi!','Post-Punk','Power Pop','Proto-Punk','Punk','Ska Revival','Straight-Edge','Synth Pop']],
		['Rock & Roll/Roots',                   ['American Trad Rock','Bar Band','Blues-Rock','Frat Rock','Heartland Rock','Hot Rod','Hot Rod Revival','Instrumental Rock','Jam Bands','Latin Rock','Pub Rock','Retro-Rock','Rock & Roll','Rockabilly','Rockabilly Revival','Roots Rock','Surf','Surf Revival','Swamp Pop','Tex-Mex']],
		['Singer/Songwriter',                   ['Contemporary Singer/Songwriter','Alternative Singer/Songwriter']],
		['Soft Rock',                           ['Adult Contemporary']],
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
		
		// Supergenre Clusters
		
		// Supergenre SuperClusters
		
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