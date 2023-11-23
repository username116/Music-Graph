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

	],
	/*
		-> SuperGenres: Mega-Groups of genres and styles. Users may want to edit these at the user's descriptor file
	*/
	// Here genres and styles are put into their main category. Like 'Progressive Rock' and 'Hard Rock' into 'Rock&Roll Supergenre'
	// This points to genre and styles which are considered to belong to the same parent musical genre, while not necessarily being
	// considered 'similar' in an 'listening session' sense. For ex. 'Space Rock' and 'Southern Rock' can be considered Rock but pretty
	// different when looking for Rock tracks. On the other hand, they are similar if you compare them to Jazz.
	style_supergenre: [

		['Ambient',                                   ['Ambient Americana','Ambient Noise Wall','Dark Ambient','Space Ambient','Tribal Ambient']],
		['Blues',                                     ['Acoustic Blues','Boogie Woogie','Country Blues','Electric Blues','Fife and Drum Blues','Jump Blues','New Orleans Blues','Piano Blues','Soul Blues','Vaudeville Blues']],
		['Classical Music',                           ['Arabic Classical Music','Azerbaijani Mugham','East Asian Classical Music','Inkiranya','Minyue','Persian Classical Music','Pìobaireachd','Shashmaqam','South Asian Classical Music','Southeast Asian Classical Music','Sufiana kalam','Turkish Classical Music','Western Classical Music']],
		['Country',                                   ['Alt-Country','Bluegrass','Contemporary Country','Country & Irish','Country Boogie','Country Pop','Honky Tonk','Nashville Sound','Progressive Country','Red Dirt','Traditional Country','Trampská hudba','Western','Western Swing']],
		['Dance',                                     ['Alternative Dance','Dance-Pop','Disco','Electronic Dance Music','Miami Bass']],
		['Electronic',                                ['Algorave','Binaural Beats','Bit Music','Bitpop','Celtic Electronica','Chillout','Digital Fusion','Drift Phonk','Dungeon Synth','Electroacoustic','Electro-Industrial','Electronic Dance Music','Electropop','Epic Collage','Flashcore','Folktronica','Funktronica','Glitch','Glitch Hop','HexD','Horror Synth','Hyperpop','IDM','Illbient','Indietronica','Latin Electronic','Livetronica','Microsound','Minatory','Minimal Wave','Moogsploitation','Nightcore','Nu Jazz','Power Electronics','Power Noise','Progressive Electronic','Space Ambient','Synthpop','Synth Punk','Synthwave','Tecnobrega','Vapor','Wave','Witch House']],
		['Experimental',                              ['Conducted Improvisation','Data Sonification','Drone','Electroacoustic','Free Improvisation','Futurism','Glitch','Indeterminacy','Industrial','Microsound','Modern Creative','Noise','Plunderphonics','Reductionism','Sound Art','Sound Collage','Sound Poetry','Tape Music','Turntable Music']],
		['Folk',                                      ['Contemporary Folk','Traditional Folk Music']],
		['Hip Hop',                                   ['Abstract Hip Hop','Afroswing','Afro Trap','Arabesque Rap','Bongo Flava','Boom Bap','Bounce','Chipmunk Soul','Chopped and Screwed','Christian Hip Hop','Cloud Rap','Comedy Rap','Conscious Hip Hop','Country Rap','Crunk','Digicore','Dirty South','Disco Rap','Drumless','East Coast Hip Hop','Emo Rap','Experimental Hip Hop','French Hip Hop','Genge','G-Funk','Hardcore Hip Hop','Hipco','Hiplife','Hyphy','Instrumental Hip Hop','Japanese Hip Hop','Jazz Rap','Jigg','Jook','Latin Rap','Lo-Fi Hip Hop','Lowend','Miami Bass','Mobb Music','Nerdcore Hip Hop','Nervous Music','Political Hip Hop','Pop Rap','Ratchet Music','Snap','Southern Hip Hop','Trap','Turntablism','UK Hip Hop','West Coast Hip Hop']],
		['Industrial & Noise',                        ['Industrial','Noise','Post-Industrial']],
		['Jazz',                                      ['Afro-Jazz','Arabic Jazz','Avant-Garde Jazz','Bebop','Big Band','British Dance Band','Bulawayo Jazz','Cape Jazz','Cartoon Music','Chamber Jazz','Cool Jazz','Crime Jazz','Dark Jazz','Dixieland','ECM Style Jazz','Ethio-Jazz','Flamenco Jazz','Hard Bop','Indo Jazz','Jazz-Funk','Jazz Fusion','Jazz manouche','Jazz Poetry','Latin Jazz','Marabi','Modal Jazz','Post-Bop','Samba-jazz','Smooth Jazz','Soul Jazz','Spiritual Jazz','Spy Music','Stride','Swing','Third Stream','Vocal Jazz']],
		['Metal',                                     ['Alternative Metal','Avant-Garde Metal','Black Metal','Death Metal','Doom Metal','Drone Metal','Folk Metal','Gothic Metal','Grindcore','Groove Metal','Heavy Metal','Industrial Metal','Kawaii Metal','Metalcore','Neoclassical Metal','Post-Metal','Power Metal','Progressive Metal','Sludge Metal','Southern Metal','Stenchcore','Stoner Metal','Symphonic Metal','Thrash Metal','Trance Metal','Viking Metal']],
		['Musical Theatre and Entertainment',         ['Ballad Opera','Cabaret','Cuplé','Dutch Cabaret','Kabarett','Kanto','Minstrelsy','Murga','Music Hall','Operetta','Revue','Rock Musical','Show Tunes','Siffleur','Singspiel','Vaudeville']],
		['New Age',                                   ['Andean New Age','Celtic New Age','Native American New Age','Neoclassical New Age','New Age Kirtan','Tibetan New Age']],
		['Pop',                                       ['Adult Contemporary','Afrobeats','Alt-Pop','Arabic Pop','Art Pop','Balkan Pop-Folk','Baroque Pop','Bitpop','Blue-Eyed Soul','Boy Band','Brega calypso','Brill Building','Bubblegum','Cambodian Pop','Canción melódica','CCM','City Pop','Classical Crossover','Country Pop','C-Pop','Dance-Pop','Dangdut','Dansbandsmusik','Dansktop','Denpa','Electropop','Europop','Flamenco Pop','Folk Pop','French Pop','Girl Group','Glitch Pop','Hyperpop','Indian Pop','Indie Pop','Irish Showband','Italo Pop','Jazz Pop','J-Pop','Kayōkyoku','Korean Ballad','K-Pop','Latin Pop','Lokal musik','Mulatós','Nederpop','New Music','New Romantic','OPM','Orthodox Pop','Persian Pop','Pop Batak','Pop Ghazal','Pop Minang','Pop Raï','Pop Reggae','Pop Rock','Pop Soul','Pop Sunda','Progressive Pop','Psychedelic Pop','Rabiz','Rigsar','Rumba catalana','Russian Chanson','Schlager','Sertanejo romântico','Sertanejo universitário','Sophisti-Pop','Soviet Estrada','Sunshine Pop','Synthpop','Teen Pop','Traditional Pop','Turkish Pop','Vocal Trance','V-Pop','Yé-yé']],
		['Psychedelia',                               ['Neo-Psychedelia','Psychedelic Folk','Psychedelic Pop','Psychedelic Rock','Psychedelic Soul','Stoner Rock','Tropicália']],
		['Punk',                                      ['Art Punk','Cowpunk','Digital Hardcore','Emo','Folk Punk','Hardcore [Punk]','Mod Revival','Post-Punk','Proto-Punk','Punk Blues','Punk Rock','Synth Punk']],
		['R&B',                                       ['Acid Jazz','Blue-Eyed Soul','Boogie','Contemporary R&B','Doo-Wop','Funk','New Orleans R&B','Rhythm & Blues','Soul']],
		['Regional Music',                            ['African Music','Ancient Music','Arabic Music','Asian Music','Caribbean Music','Christian Liturgical Music','European Music','Gospel','Hispanic Music','Indigenous American Music','Islamic Modal Music','Islamic Religious Music & Recitation','Jewish Music','Northern American Music','Oceanian Music','Polyphonic Chant','Prehistoric Music','South American Music','Sufi Music','Traditional Folk Music','Turkic-Mongolic Traditional Music']],
		['Rock',                                      ['Acoustic Rock','Afro-Rock','Alternative Rock','Anatolian Rock','AOR','Art Punk','Art Rock','Bard Rock','Blues Rock','British Rhythm & Blues','Candombe beat','Christian Rock','Comedy Rock','Country Rock','Cowpunk','Deutschrock','Emo','Experimental Rock','Folk Rock','Funk Rock','Garage Rock','Glam Rock','Hardcore [Punk]','Hard Rock','Heartland Rock','Industrial Rock','Jam Band','Jazz-Rock','Latin Rock','Manguebeat','Math Rock','Metal','Miejski folk','Mod','New Wave','Noise Rock','Pop Rock','Post-Punk','Post-Rock','Progressive Rock','Proto-Punk','Psychedelic Rock','Pub Rock','Punk Blues','Punk Rock','Rap Rock','Reggae Rock','Rock & Roll','Rock andaluz','Rock andino','Rock Musical','Rock Opera','Rock urbano español','Roots Rock','Southern Rock','Sufi Rock','Surf Music','Symphonic Rock','Tolai Rock','Zolo']],
		['Singer-Songwriter',                         ['Avtorskaya pesnya','Canzone d\u0027autore','Chanson à texte','Euskal kantagintza berria','Kleinkunst','Liedermacher','Música de intervenção','Nova cançó','Nòva cançon','Nueva canción','Poezja śpiewana']],
		['Spoken Word',                               ['Fairy Tales','Folktales','Guided Meditation','Interview','Lectures','Poetry','Radio Drama','Speeches','Stand-Up Comedy']],
		['Comedy',                                    ['Break-In','Dutch Cabaret','Kabarett','Musical Comedy','Prank Calls','Sketch Comedy','Stand-Up Comedy']],
		['Darkwave',                                  ['Ethereal Wave','Neoclassical Darkwave']],
		['Easy Listening',                            ['Cocktail Nation','Exotica','Light Music','Lounge','Pops Orchestra','Space Age Pop']],
		['Field Recordings',                          ['Nature Recordings','Radio Broadcast Recordings']],
		['Marching Band',                             ['Drumline','Fife and Drum Corps','Guggenmusik','Pep Band','Pipe Band']],
		['Shibuya-kei',                               ['Akishibu-kei','Picopop']],
		['Ska',                                       ['2 Tone','Jamaican Ska','Spouge','Third Wave Ska']],
		['Sounds and Effects',                        ['Battle Record','Binaural Beats']],
		['Dark Ambient',                              ['Black Ambient','Ritual Ambient']],
		['Acoustic Blues',                            ['Acoustic Chicago Blues','Acoustic Texas Blues','Jug Band','Piedmont Blues']],
		['Country Blues',                             ['Acoustic Texas Blues','Delta Blues','Hill Country Blues','Piedmont Blues']],
		['Electric Blues',                            ['British Blues','Chicago Blues','Electric Texas Blues','Swamp Blues']],
		['Arabic Classical Music',                    ['Andalusian Classical Music','Iraqi Maqam','Sawt']],
		['East Asian Classical Music',                ['Chinese Classical Music','Japanese Classical Music','Korean Classical Music','Vietnamese Classical Music']],
		['South Asian Classical Music',               ['Carnatic Classical Music','Hindustani Classical Music','Odissi Classical Music']],
		['Southeast Asian Classical Music',           ['Burmese Classical Music','Gamelan','Kacapi suling','Kulintang','Mahori','Malay Classical Music','Pinpeat','Saluang klasik','Talempong','Tembang Sunda Cianjuran','Thai Classical Music']],
		['Turkish Classical Music',                   ['Turkish Mevlevi Music']],
		['Western Classical Music',                   ['Art Song','Ballet','Baroque Music','Baroque Suite','Brazilian Classical Music','Byzantine Music','Cantata','Chamber Music','Choral','Cinematic Classical','Classical March','Classical Period','Divertissement','Étude','Fantasia','Latin American Classical Music','Madrigal','Medieval Classical Music','Modern Classical','Motet','Neoclassicism','Nocturne','Opera','Oratorio','Orchestral','Overture','Prelude','Renaissance Music','Ricercar','Romanticism','Serenade','Sonata','Spanish Classical Music','Toccata']],
		['Alt-Country',                               ['Gothic Country']],
		['Bluegrass',                                 ['Bluegrass Gospel','Progressive Bluegrass']],
		['Contemporary Country',                      ['Neo-Traditionalist Country']],
		['Country Pop',                               ['Bro-Country','Countrypolitan','Urban Cowboy']],
		['Honky Tonk',                                ['Bakersfield Sound','Truck Driving Country']],
		['Nashville Sound',                           ['Countrypolitan']],
		['Progressive Country',                       ['Outlaw Country']],
		['Traditional Country',                       ['Close Harmony','Country Gospel','Country Yodeling']],
		['Alternative Dance',                         ['Grebo','New Rave']],
		['Dance-Pop',                                 ['Bubblegum Dance','Disco polo','Freestyle','Funk melody','Romanian Popcorn','Tecnorumba','Township Bubblegum']],
		['Disco',                                     ['Boogie','Electro-Disco','Euro-Disco','Latin Disco','Mutant Disco','Nu-Disco']],
		['Electronic Dance Music',                    ['Artcore','Balani Show','Balearic Beat','Bérite Club','Breakbeat','Broken Beat','Bubblegum Bass','Bubbling','Budots','Coupé-décalé','Cruise','Dariacore','Deconstructed Club','Digital Cumbia','Drum and Bass','Dubstep','East Coast Club','EBM','Electro','Electroclash','Electro-Disco','Electro latino','Electro Swing','Eurobeat','Eurodance','Flex Dance Music','Footwork','Freestyle','Funkot','Future Bass','Future Rave','Ghettotech','Glitch Hop [EDM]','Grime','Hardcore [EDM]','Hard Dance','Hard Drum','Hardvapour','Hardwave','House','Hyper Techno','Jungle Terror','Kuduro','Makina','Manyao','Midtempo Bass','Moombahcore','Moombahton','Nerdcore Techno','Nu-Disco','Ori deck','Shangaan Electro','Singeli','Techno','Techno Bass','Tecnorumba','Trance','Trap [EDM]','Tribal Guarachero','UK Bass','UK Funky','UK Garage','Wonky']],
		['Miami Bass',                                ['Atlanta Bass','Tamborzão','Techno Bass']],
		['Bit Music',                                 ['Chiptune','FM Synthesis','MIDI Music','Sequencer & Tracker']],
		['Chillout',                                  ['Ambient Dub','Ambient House','Ambient Trance','Balearic Beat','Barber Beats','Downtempo','Psybient']],
		['Dungeon Synth',                             ['Comfy Synth','Winter Synth']],
		['Electroacoustic',                           ['Acousmatic Music','EAI','Musique concrète']],
		['Electro-Industrial',                        ['Dark Electro']],
		['IDM',                                       ['Drill and Bass']],
		['Indietronica',                              ['Chillwave','Glitch Pop']],
		['Latin Electronic',                          ['Changa tuki','Digital Cumbia','Electro latino','Electrotango','Nortec','Tribal Guarachero']],
		['Minimal Wave',                              ['Minimal Synth']],
		['Power Electronics',                         ['Death Industrial']],
		['Progressive Electronic',                    ['Berlin School']],
		['Synthpop',                                  ['Futurepop','Pon-chak disco','Techno kayō']],
		['Synthwave',                                 ['Chillsynth','Darksynth']],
		['Tecnobrega',                                ['Tecnofunk']],
		['Vapor',                                     ['Barber Beats','Dreampunk','Future Funk','Hardvapour','Utopian Virtual','Vaportrap','Vaporwave']],
		['Wave',                                      ['Hardwave','Neo-Grime']],
		['Free Improvisation',                        ['EAI']],
		['Industrial',                                ['Power Electronics']],
		['Noise',                                     ['Ambient Noise Wall','Black Noise','Gorenoise','Harsh Noise','Power Electronics','Power Noise']],
		['Reductionism',                              ['Lowercase','Onkyo']],
		['Sound Collage',                             ['Epic Collage']],
		['Contemporary Folk',                         ['American Primitivism','Anti-Folk','Avant-Folk','Campus Folk','Chamber Folk','Folk Baroque','Folk Pop','Indie Folk','Neofolk','Neofolklore','Progressive Folk','Psychedelic Folk','Skiffle','Xinyao']],
		['Traditional Folk Music',                    ['African Folk Music','American Folk Music','Arabic Folk Music','Australian Folk Music','Austronesian Traditional Music','Brazilian Folk Music','Buryat Folk Music','Canadian Folk Music','Caribbean Folk Music','Caucasian Folk Music','Chukchi Folk Music','East Asian Folk Music','European Folk Music','Hazara Folk Music','Hispanic American Folk Music','Indigenous American Traditional Music','Ladino Folksong','Ob-Ugric Folk Music','Payada','Romani Folk Music','Samoyedic Folk Music','South Asian Folk Music','Southeast Asian Folk Music','West Asian Folk Music','Work Songs','Yodeling']],
		['Comedy Rap',                                ['Chap Hop']],
		['Crunk',                                     ['Crunkcore']],
		['Experimental Hip Hop',                      ['Industrial Hip Hop']],
		['Genge',                                     ['Gengetone']],
		['Hardcore Hip Hop',                          ['Britcore','Gangsta Rap','Horrorcore','Memphis Rap','Mid-School Hip Hop','Trap Metal']],
		['Hyphy',                                     ['Jerk Rap']],
		['Instrumental Hip Hop',                      ['Rare Phonk']],
		['Latin Rap',                                 ['Chicano Rap']],
		['Pop Rap',                                   ['Bop','Futuristic Swag']],
		['Trap',                                      ['Detroit Trap','Drill','Futuristic Swag','No Melody','Plugg','Rage','Rare Phonk','Regalia','Sigilkore','Trap latino','Trap Metal','Trap shaabi','Trap Soul','Tread']],
		['Post-Industrial',                           ['Dark Ambient','Deconstructed Club','EBM','Electro-Industrial','Epic Collage','Industrial Hardcore','Industrial Hip Hop','Industrial Metal','Industrial Rock','Industrial Techno','Martial Industrial','Power Noise']],
		['Avant-Garde Jazz',                          ['Experimental Big Band','Free Jazz','Yass']],
		['Big Band',                                  ['Experimental Big Band','Progressive Big Band']],
		['Latin Jazz',                                ['Afro-Cuban Jazz']],
		['Marabi',                                    ['Kwela','Mbaqanga']],
		['Modal Jazz',                                ['Jazz Mugham']],
		['Swing',                                     ['Swing Revival']],
		['Vocal Jazz',                                ['Vocalese']],
		['Alternative Metal',                         ['Funk Metal','Neue Deutsche Härte','Nu Metal','Rap Metal']],
		['Black Metal',                               ['Atmospheric Black Metal','Black \u0027n\u0027 Roll','Black Noise','Depressive Black Metal','Melodic Black Metal','Pagan Black Metal','Symphonic Black Metal','War Metal']],
		['Death Metal',                               ['Brutal Death Metal','Death \u0027n\u0027 Roll','Deathgrind','Melodic Death Metal','Technical Death Metal']],
		['Doom Metal',                                ['Death Doom Metal','Funeral Doom Metal','Traditional Doom Metal']],
		['Folk Metal',                                ['Celtic Metal','Mittelalter-Metal']],
		['Grindcore',                                 ['Cybergrind','Deathgrind','Goregrind','Mincecore']],
		['Heavy Metal',                               ['NWOBHM','Speed Metal','US Power Metal']],
		['Industrial Metal',                          ['Cyber Metal','Neue Deutsche Härte']],
		['Metalcore',                                 ['Deathcore','Mathcore','Melodic Metalcore']],
		['Post-Metal',                                ['Atmospheric Sludge Metal']],
		['Progressive Metal',                         ['Djent']],
		['Sludge Metal',                              ['Atmospheric Sludge Metal']],
		['Thrash Metal',                              ['Crossover Thrash','Technical Thrash Metal']],
		['Murga',                                     ['Murga uruguaya']],
		['Operetta',                                  ['Kalon\u0027ny fahiny']],
		['Vaudeville',                                ['Vaudeville Blues']],
		['Afrobeats',                                 ['Afropiano','Alté']],
		['Arabic Pop',                                ['Al Jeel']],
		['Balkan Pop-Folk',                           ['Chalga','Manele','Modern Laika','Musika popullore','Muzică de mahala','Skiladika','Tallava','Turbo-Folk']],
		['Cambodian Pop',                             ['Rom kbach']],
		['Canción melódica',                          ['Bolero-Beat','Música cebolla']],
		['CCM',                                       ['Praise & Worship']],
		['C-Pop',                                     ['Cantopop','Mandopop','Zhongguo feng']],
		['Dangdut',                                   ['Dangdut koplo']],
		['Folk Pop',                                  ['Stomp and Holler']],
		['Indie Pop',                                 ['Bedroom Pop','C86','Chamber Pop','Neo-Acoustic','Sonido Donosti','Twee Pop']],
		['Italo Pop',                                 ['Canzone neomelodica']],
		['J-Pop',                                     ['Akishibu-kei','Yakousei']],
		['Kayōkyoku',                                 ['Idol kayō','Mood kayō','Techno kayō']],
		['Korean Ballad',                             ['Oriental Ballad']],
		['K-Pop',                                     ['Semi-Trot']],
		['Latin Pop',                                 ['Cumbia pop','Tropipop']],
		['Nederpop',                                  ['Palingsound']],
		['Pop Minang',                                ['Talempong goyang']],
		['Pop Rock',                                  ['Beat Music','Big Music','Britpop','Jangle Pop','Manila Sound','Piano Rock','Post-Britpop','Power Pop','Soft Rock','Sonido Donosti','Stereo','Twee Pop','Vocal Surf']],
		['Pop Soul',                                  ['Motown Sound']],
		['Schlager',                                  ['Humppa','Levenslied','Volkstümliche Musik']],
		['Sertanejo universitário',                   ['Arrocha sertanejo','Funknejo']],
		['Traditional Pop',                           ['British Dance Band','Mood kayō','Romanţe','Standards','Tin Pan Alley']],
		['Neo-Psychedelia',                           ['Hypnagogic Pop','Paisley Underground','Psichedelia occulta italiana','Space Rock Revival']],
		['Psychedelic Folk',                          ['Freak Folk','Free Folk']],
		['Psychedelic Rock',                          ['Acid Rock','Heavy Psych','Raga Rock','Space Rock','Zamrock']],
		['Art Punk',                                  ['Egg Punk']],
		['Emo',                                       ['Emocore','Emo-Pop','Midwest Emo','Screamo']],
		['Folk Punk',                                 ['Celtic Punk','Gypsy Punk']],
		['Hardcore [Punk]',                           ['Beatdown Hardcore','Easycore','Electronicore','Grindcore','Hardcore Punk','Metalcore','Nintendocore','Noisecore','Post-Hardcore','Sasscore']],
		['Post-Punk',                                 ['Coldwave','Dance-Punk','Gothic Rock','No Wave','Post-Punk Revival']],
		['Punk Rock',                                 ['Anarcho-Punk','Celtic Punk','Deathrock','Deutschpunk','Garage Punk','Glam Punk','Hardcore Punk','Horror Punk','Könsrock','Oi!','Pop Punk','Psychobilly','Queercore','Riot Grrrl','Ska Punk','Skate Punk','Surf Punk','Vikingarock']],
		['Contemporary R&B',                          ['Alternative R&B','Hip Hop Soul','New Jack Swing','Trap Soul','UK Street Soul']],
		['Funk',                                      ['Afro-Funk','Britfunk','Deep Funk','Go-Go','Jazz-Funk','Latin Funk','P-Funk','Porn Groove','Synth Funk']],
		['Rhythm & Blues',                            ['British Rhythm & Blues','Swamp Pop','Twist']],
		['Soul',                                      ['Chicago Soul','Country Soul','Deep Soul','Latin Soul','Neo-Soul','Northern Soul','Philly Soul','Pop Soul','Psychedelic Soul','Smooth Soul','Southern Soul']],
		['African Music',                             ['African Folk Music','Afro-Jazz','Cape Verdean Music','Central African Music','East African Music','Malagasy Music','North African Music','Northeastern African Music','Seychelles & Mascarene Islands Music','Southern African Music','West African Music']],
		['Ancient Music',                             ['Ancient Chinese Music','Ancient Egyptian Music','Ancient Greek Music','Ancient Levitical Music','Ancient Roman Music','Hyang-ak','Mesopotamian Music']],
		['Arabic Music',                              ['Algerian Chaabi','Arabic Classical Music','Arabic Folk Music','Arabic Jazz','Arabic Pop','Bedouin Music','Dabke','Druze Music','Levantine Arabic Music','Orkes gambus','Raï','Shaabi','Traditional Arabic Pop','Trap shaabi']],
		['Asian Music',                               ['Central Asian Music','East Asian Music','Ghazal','North Asian Music','South Asian Music','Southeast Asian Music','West Asian Music']],
		['Caribbean Music',                           ['Bachata','Brukdown','Bullerengue','Calypso','Caribbean Folk Music','Champeta','Cuban Music','Dembow','French Caribbean Music','Goombay','Indo-Caribbean Music','Jamaican Music','Junkanoo','Kaseko','Merengue','Parang','Porro','Punta','Soca','Tropicanibalismo','Vallenato']],
		['Christian Liturgical Music',                ['Anglican Chant','Armenian Church Music','Byzantine Chant','Coptic Music','Ethiopian Church Music','Kyivan Chant','Mass','Plainsong','Russian Orthodox Liturgical Music','Seinn nan salm','Syriac Chant']],
		['European Music',                            ['Alpenrock','Ancient Roman Music','Anglican Chant','Ashkenazi Music','Balkan Music','Ballad Opera','Baroque Music','Baroque Suite','British Music','Caucasian Music','Celtic Electronica','Celtic Metal','Celtic New Age','Celtic Punk','Celtic Rock','Chanson','Classical Period','Country & Irish','Crimean Tatar Music','Dansbandsmusik','Dansktop','Dutch Cabaret','European Folk Music','Euskal kantagintza berria','Fanfare','Finnish Tango','German Music','Grand opéra','Greek Music','Irish Showband','Italian Music','Kabarett','Kalmyk Music','Kleinkunst','Kyivan Chant','Madrigal','Medieval Classical Music','Mélodie','Mittelalter-Metal','Mittelalter-Rock','Mulatós','Nordic Folk Rock','Nova cançó','Nòva cançon','Opéra-comique','Polish Music','Portuguese Music','Renaissance Music','Romanian Music','Russian Music','Schlager','Singspiel','Spanish Music','Tragédie en musique','Trampská hudba','Verismo','Visa','Waltz']],
		['Gospel',                                    ['Country Gospel','Sacred Steel','Southern Gospel','Traditional Black Gospel']],
		['Hispanic Music',                            ['Canción melódica','Hispanic American Music','Murga','Nueva canción','Spanish Music']],
		['Indigenous American Music',                 ['Indigenous American Traditional Music','Indigenous Andean Music','Indigenous North American Music','Mesoamerican Music']],
		['Islamic Modal Music',                       ['Arabic Classical Music','Azerbaijani Mugham','Persian Classical Music','Shashmaqam','Sufiana kalam','Turkish Classical Music']],
		['Islamic Religious Music & Recitation',      ['Ginan','Maddahi','Nasheed','Rapai dabõih','Turkish Mevlevi Music']],
		['Jewish Music',                              ['Ashkenazi Music','Hasidic Music','Jewish Liturgical Music','Muzika mizrahit','Muzika yehudit mekorit','Oriental Jewish Music','Orthodox Pop','Sephardic Music']],
		['Northern American Music',                   ['Ambient Americana','Americana','American Folk Music','American Primitivism','Boogie Woogie','Canadian Folk Music','Coon Song','Country','Country Rock','Cowboy Poetry','Greenlandic Music','Hapa haole','Indigenous North American Music','Louisiana Music','Minstrelsy','Pep Band','Ragtime','Roots Rock','Sacred Steel','Shaker Music','Southern Gospel','Tejano Music','Tin Pan Alley','Vaudeville']],
		['Oceanian Music',                            ['Australian Folk Music','Indigenous Australian Traditional Music','Melanesian Music','Micronesian Music','Pacific Reggae','Polynesian Music']],
		['Polyphonic Chant',                          ['Ars nova','Ars subtilior','Cante alentejano','Cantu a tenore','Ganga','Himene tarava','Izvorna bosanska muzika','Lab Polyphony','Madrigal','Paghjella','Seto leelo','Sutartinės','Tosk Polyphony','Trallalero']],
		['South American Music',                      ['Argentine Music','Bailecito','Baithak gana','Bambuco','Brazilian Music','Bullerengue','Calipso venezolano','Candombe','Candombe beat','Caporal','Carnaval cruceño','Carranga','Chacarera','Chamamé','Chamarrita rioplatense','Champeta','Chilean Music','Chuntunqui romántico','Conjunto andino','Cueca','Cumbia colombiana','Cumbia peruana','Cumbia pop','Currulao','Electrotango','Gaita zuliana','Guarania','Indigenous Andean Music','Joropo','Kaseko','Malagueña venezolana','Mambo chileno','Mapuche Folk Music','Milonga','Muliza','Murga uruguaya','Onda nueva','Pasillo','Payada','Peruvian Music','Polka paraguaya','Porro','RKT','Rock andino','Salsa choke','Saya','Tango','Taquirari','Tecnomerengue','Vallenato','Yaraví','Zamacueca','Zamba']],
		['Sufi Music',                                ['Kafi','Manzuma','Qawwali','Rapai dabõih','Sufiana kalam','Sufi Rock','Turkish Mevlevi Music']],
		['Turkic-Mongolic Traditional Music',         ['Altai Traditional Music','Bashkir Folk Music','Buryat Folk Music','Central Asian Throat Singing','Karakalpak Traditional Music','Khakas Traditional Music','Kyrgyz Traditional Music','Sakha Traditional Music']],
		['Alternative Rock',                          ['Alternative Dance','Baggy','Britpop','Dream Pop','Emo-Pop','Geek Rock','Grunge','Indie Rock','Jangle Pop','J-Rock','Post-Britpop','Post-Grunge','Shoegaze']],
		['Blues Rock',                                ['Boogie Rock']],
		['Experimental Rock',                         ['Avant-Prog','Krautrock','No Wave']],
		['Folk Rock',                                 ['Alpenrock','British Folk Rock','Celtic Rock','Mittelalter-Rock','Nordic Folk Rock','Phleng phuea chiwit','Pinoy Folk Rock','Rock rural']],
		['Funk Rock',                                 ['Funk Metal']],
		['Garage Rock',                               ['Freakbeat','Garage Punk','Garage Rock Revival']],
		['Glam Rock',                                 ['Glam Punk']],
		['Hard Rock',                                 ['Glam Metal','Heavy Psych','Stoner Rock']],
		['Jam Band',                                  ['Jamgrass','Livetronica']],
		['Math Rock',                                 ['Math Pop']],
		['Mod',                                       ['Mod Revival']],
		['New Wave',                                  ['Neue Deutsche Welle','New Romantic']],
		['Noise Rock',                                ['Shitgaze']],
		['Progressive Rock',                          ['Avant-Prog','Canterbury Scene','Neo-Prog','Symphonic Prog']],
		['Rap Rock',                                  ['Rap Metal']],
		['Rock & Roll',                               ['Indorock','Rockabilly','Twist']],
		['Roots Rock',                                ['Swamp Rock','Tex-Mex']],
		['Surf Music',                                ['Indie Surf','Surf Punk','Surf Rock','Vocal Surf']],
		['Avtorskaya pesnya',                         ['Bard Rock']],
		['Nueva canción',                             ['Nueva canción española','Nueva canción latinoamericana']],
		['Poetry',                                    ['Beat Poetry','Cowboy Poetry','Dub Poetry','Jazz Poetry','Slam Poetry','Sound Poetry']],
		['Musical Comedy',                            ['Comedy Rap','Comedy Rock','Scrumpy and Western']],
		['Nature Recordings',                         ['Animal Sounds']],
		['Third Wave Ska',                            ['Ska Punk']],
		['Chinese Classical Music',                   ['Baisha xiyue','Chinese Opera','Dongjing','Yayue']],
		['Japanese Classical Music',                  ['Gagaku','Heikyoku','Honkyoku','Jiuta','Jōruri','Meiji shinkyoku','Nagauta','Noh','Shōmyō','Sōkyoku']],
		['Korean Classical Music',                    ['Aak','Dang-ak','Hyang-ak','Jeong-ak']],
		['Vietnamese Classical Music',                ['Ca trù','Vietnamese Opera']],
		['Hindustani Classical Music',                ['Dhrupad','Kafi','Khyal','Qawwali','Shabad kirtan','Thumri']],
		['Gamelan',                                   ['Balinese Gamelan','Gamelan degung','Javanese Gamelan','Malay Gamelan']],
		['Malay Classical Music',                     ['Malay Gamelan']],
		['Thai Classical Music',                      ['Fon leb','Khrueang sai','Piphat']],
		['Art Song',                                  ['Elizabethan Song','Lied','Mélodie','Orchestral Song']],
		['Ballet',                                    ['Ballet de cour','Opéra-ballet']],
		['Baroque Music',                             ['Ballet de cour','Opéra-ballet','Zarzuela barroca']],
		['Brazilian Classical Music',                 ['Valsa brasileira']],
		['Byzantine Music',                           ['Byzantine Chant']],
		['Choral',                                    ['Choral Concerto','Choral Symphony','Mass']],
		['Cinematic Classical',                       ['Epic Music','Spaghetti Western']],
		['Classical March',                           ['Circus March','Dobrado','Funeral March']],
		['Medieval Classical Music',                  ['Ars antiqua','Ars nova','Ars subtilior','Medieval Lyric Poetry','Plainsong']],
		['Modern Classical',                          ['Expressionism','Futurism','Impressionism','Indeterminacy','Microtonal Classical','Minimalism','Musique concrète instrumentale','New Complexity','Post-Minimalism','Serialism','Sonorism','Spectralism','Stochastic Music']],
		['Opera',                                     ['Ballad Opera','Grand opéra','Monodrama','Opéra-ballet','Opera buffa','Opéra-comique','Opera semiseria','Opera seria','Operetta','Romantische Oper','Singspiel','Tragédie en musique','Verismo','Zarzuela','Zeitoper']],
		['Orchestral',                                ['Concert Band','Concerto','Orchestral Song','Symphony','Tone Poem']],
		['Renaissance Music',                         ['Elizabethan Song']],
		['Romanticism',                               ['Grand opéra','Romantische Oper']],
		['Spanish Classical Music',                   ['Canto mozárabe','Zarzuela']],
		['Progressive Bluegrass',                     ['Jamgrass']],
		['Country Gospel',                            ['Bluegrass Gospel']],
		['Freestyle',                                 ['Latin Freestyle']],
		['Electro-Disco',                             ['Hi-NRG','Italo-Disco','Space Disco']],
		['Breakbeat',                                 ['Acid Breaks','Baltimore Club','Big Beat','Breakbeat Hardcore','Breakbeat Kota','Florida Breaks','Nu Skool Breaks','Progressive Breaks','Psybreaks','West Coast Breaks']],
		['Drum and Bass',                             ['Atmospheric Drum and Bass','Dancefloor Drum and Bass','Darkstep','Drumfunk','Drumstep','Dubwise Drum and Bass','Footwork Jungle','Halftime','Hardstep','Jazzstep','Jump-Up','Jungle','Liquid Drum and Bass','Minimal Drum and Bass','Neurofunk','Techstep','Trancestep']],
		['Dubstep',                                   ['Brostep','Chillstep','Dungeon Sound','Melodic Dubstep','Purple Sound','Riddim','Tearout']],
		['East Coast Club',                           ['Baltimore Club','Jersey Club','Philly Club']],
		['EBM',                                       ['Dark Electro','Futurepop','New Beat']],
		['Electro',                                   ['Skweee']],
		['Eurodance',                                 ['Bubblegum Dance','Italo Dance']],
		['Footwork',                                  ['Footwork Jungle']],
		['Funkot',                                    ['Breakbeat Kota']],
		['Future Bass',                               ['Kawaii Future Bass']],
		['Glitch Hop [EDM]',                          ['Ghetto Funk','Neurohop']],
		['Grime',                                     ['Neo-Grime','Weightless']],
		['Hardcore [EDM]',                            ['Acidcore','Belgian Techno','Breakbeat Hardcore','Breakcore','Crossbreed','Deathchant Hardcore','Digital Hardcore','Doomcore','Freeform Hardcore','Frenchcore','Gabber','Happy Hardcore','Hardtek','Industrial Hardcore','J-core','Speedcore','Terrorcore','Uptempo Hardcore']],
		['Hard Dance',                                ['Hardstyle','Hardtek','Hard Trance','Jumpstyle','Lento violento','NRG','UK Hardcore','UK Hard House']],
		['House',                                     ['Acid House','Afro House','Amapiano','Ambient House','Ballroom','Baltimore Club','Bass House','Bassline','Big Room House','Brazilian Bass','Bubbling House','Changa tuki','Chicago Hard House','Chicago House','Deep House','Diva House','Electro House','Euro House','Festival Progressive House','French House','Funky House','Future Funk','Future House','Garage House','Ghetto House','G-House','Gqom','Hip House','Italo House','Jackin\u0027 House','Kwaito','Latin House','Microhouse','Organic House','Outsider House','Progressive House','Romanian Popcorn','Speed Garage','Tech House','Tribal House','Tropical House','UK Hard House','UK Jackin\u0027','Vinahouse']],
		['Kuduro',                                    ['Batida']],
		['Techno',                                    ['Acid Techno','Ambient Techno','Belgian Techno','Bleep Techno','Detroit Techno','Freetekno','Hardgroove Techno','Hard Techno','Industrial Techno','Melodic Techno','Minimal Techno','Peak Time Techno','Wonky Techno']],
		['Trance',                                    ['Acid Trance','Big Room Trance','Dream Trance','Euro-Trance','Hard Trance','Ibiza Trance','NRG','Progressive Trance','Psytrance','Tech Trance','Uplifting Trance','Vocal Trance']],
		['Trap [EDM]',                                ['Festival Trap','Hard Trap','Heaven Trap','Hybrid Trap','Twerk']],
		['UK Garage',                                 ['2-Step','Bassline','Breakstep','Future Garage','Speed Garage']],
		['MIDI Music',                                ['Black MIDI']],
		['Sequencer & Tracker',                       ['16-bit','Tracker Music']],
		['Downtempo',                                 ['Trip Hop']],
		['Dark Electro',                              ['Aggrotech']],
		['Chillwave',                                 ['Chillsynth']],
		['Vaporwave',                                 ['Broken Transmission','Mallsoft','Slushwave']],
		['Harsh Noise',                               ['Harsh Noise Wall']],
		['Avant-Folk',                                ['Free Folk']],
		['Indie Folk',                                ['Stomp and Holler']],
		['Neofolk',                                   ['Dark Folk']],
		['African Folk Music',                        ['Ambasse bey','Apala','Batuque','Dagomba Music','Gnawa','Kabye Folk Music','Kilapanga','Malagasy Folk Music','Mbenga-Mbuti Music','Moutya','Ngoma','Semba','Southern African Folk Music','Tchinkoumé','Traditional Maloya','Traditional Séga','Zinli']],
		['American Folk Music',                       ['Appalachian Folk Music','Barbershop','Country Blues','Field Hollers','Fife and Drum Blues','Jug Band','Ring Shout','Sacred Harp Music','Spirituals','Talking Blues','Traditional Black Gospel','Traditional Cajun Music','Traditional Country']],
		['Arabic Folk Music',                         ['Aita','Arabic Bellydance Music','Fijiri']],
		['Austronesian Traditional Music',            ['Gondang','Indigenous Taiwanese Music','Pakacaping Music']],
		['Brazilian Folk Music',                      ['Aboio','Banda de pífano','Candomblé Music','Cantoria','Capoeira Music','Fandango caiçara','Jongo','Lundu','Maracatu','Modinha','Rasqueado','Samba de roda','Sertanejo de raiz']],
		['Canadian Folk Music',                       ['Canadian Maritime Folk','French-Canadian Folk Music','Newfoundland Folk Music']],
		['Caribbean Folk Music',                      ['Bele','Benna','Bomba','Fungi','Garifuna Folk Music','Haitian Vodou Drumming','Jibaro','Kitchen Dance Music','Mento','Méringue','Plena','Ripsaw','Trinidadian Cariso','Tumba','Virgin Islander Cariso']],
		['Caucasian Folk Music',                      ['Abkhazian Folk Music','Chechen Folk Music','Circassian Folk Music','Dagestani Folk Music','Georgian Folk Music','Ossetian Folk Music']],
		['East Asian Folk Music',                     ['Chinese Folk Music','Indigenous Taiwanese Music','Japanese Folk Music','Korean Folk Music','Vietnamese Folk Music']],
		['European Folk Music',                       ['Alpine Folk Music','Balkan Folk Music','Baltic Folk Music','Balto-Finnic Folk Music','Basque Folk Music','Catalan Folk Music','Celtic Folk Music','Dutch Folk Music','English Folk Music','Flemish Folk Music','French Folk Music','German Folk Music','Għana','Hungarian Folk Music','Istrian Folk Music','Italian Folk Music','Neo-Medieval Folk','Neo-Pagan Folk','Nordic Folk Music','Polka','Portuguese Folk Music','Romanian Folk Music','Sardinian Folk Music','Slavic Folk Music','Spanish Folk Music','Volga-Ural Folk Music','Walloon Folk Music','White Voice','Yiddish Folksong']],
		['Hispanic American Folk Music',              ['Bambuco','Bomba','Candombe','Canto a lo poeta','Carranga','Chacarera','Chamarrita rioplatense','Cueca','Jibaro','Joropo','Malagueña venezolana','Mexican Folk Music','Milonga','Muliza','Música criolla peruana','Plena','Saya','Tamborito','Taquirari','Tonada chilena','Yaraví','Zamacueca','Zamba']],
		['Indigenous American Traditional Music',     ['Athabaskan Fiddling','Inuit Vocal Games','James Bay Fiddling','Mapuche Folk Music','Powwow Music','Tonada potosina','Unakesa']],
		['South Asian Folk Music',                    ['Assamese Folk Music','Bengali Folk Music','Bhojpuri Folk Music','Boduberu','Burushaski Folk Music','Gujarati Folk Music','Kannada Folk Music','Kirtan','Malayali Folk Music','Marathi Folk Music','Newa Folk Music','Odia Folk Music','Pashto Folk Music','Punjabi Folk Music','Rajasthani Folk Music','Sinhalese Folk Music','Tamil Folk Music','Telugu Folk Music']],
		['Southeast Asian Folk Music',                ['Balitaw','Bamar Folk Music','Filipino Rondalla','Gondang','Hill Tribe Music','Khmer Folk Music','Kuda kepang','Kundiman','Lao Folk Music','Malay Folk Music','Thai Folk Music']],
		['West Asian Folk Music',                     ['Alevi Folk Music','Armenian Folk Music','Assyrian Folk Music','Fijiri','Israeli Folk Music','Kurdish Folk Music','Luri Folk Music','Meyxana','Persian Folk Music','Turkish Folk Music']],
		['Work Songs',                                ['Aboio','Field Hollers','Òrain luaidh','Sea Shanty','Shan’ge']],
		['Yodeling',                                  ['Country Yodeling','Naturjodel']],
		['Gangsta Rap',                               ['Chicano Rap']],
		['Memphis Rap',                               ['Dungeon Rap']],
		['Drill',                                     ['Chicago Drill','Jersey Drill','Sample Drill','UK Drill']],
		['Plugg',                                     ['Dark Plugg','PluggnB']],
		['Industrial Techno',                         ['Birmingham Sound']],
		['Free Jazz',                                 ['European Free Jazz']],
		['Atmospheric Black Metal',                   ['Blackgaze']],
		['Brutal Death Metal',                        ['Slam Death Metal']],
		['Technical Death Metal',                     ['Dissonant Death Metal']],
		['Traditional Doom Metal',                    ['Epic Doom Metal']],
		['Goregrind',                                 ['Gorenoise','Pornogrind']],
		['Beat Music',                                ['Freakbeat','Group Sounds','Jovem Guarda','Merseybeat','Nederbeat']],
		['Jangle Pop',                                ['C86','Neo-Acoustic','Paisley Underground']],
		['Soft Rock',                                 ['Tropical Rock','Yacht Rock']],
		['Space Rock',                                ['Space Rock Revival']],
		['Screamo',                                   ['Emoviolence']],
		['Hardcore Punk',                             ['Burning Spirits','Crossover Thrash','Crust Punk','D-Beat','Japanese Hardcore','Melodic Hardcore','Mincecore','New York Hardcore','Powerviolence','Skacore','Street Punk','Thrashcore','UK82']],
		['Post-Hardcore',                             ['Emocore','Screamo','Swancore']],
		['Gothic Rock',                               ['Deathrock']],
		['Pop Punk',                                  ['Easycore','Seishun Punk']],
		['Ska Punk',                                  ['Skacore']],
		['Synth Funk',                                ['Minneapolis Sound']],
		['Cape Verdean Music',                        ['Batuque','Coladeira','Funaná','Morna']],
		['Central African Music',                     ['Ambasse bey','Assiko','Banda Music','Bend-skin','Bikutsi','Congolese Rumba','Kalindula','Kilapanga','Kizomba','Kuduro','Makossa','Mbenga-Mbuti Music','Puxa','Semba','Soukous','Tradi-Modern','Twa Music','Zamrock']],
		['East African Music',                        ['Benga','Bongo Flava','Comorian Music','Genge','Gogo Music','Inkiranya','Kadongo kamu','Kapuka','Kidandali','Kidumbak','Marrabenta','Mchiriku','Muziki wa dansi','Ngoma','Omutibo','Singeli','Taarab','Timbila','Twa Music']],
		['Malagasy Music',                            ['Kalon\u0027ny fahiny','Malagasy Folk Music','Salegy','Tsapiky']],
		['North African Music',                       ['Aita','Algerian Chaabi','Amazigh Music','Ancient Egyptian Music','Andalusian Classical Music','Coptic Music','Gnawa','Malhun','Moorish Music','Moroccan Chaabi','Raï','Shaabi','Trap shaabi']],
		['Northeastern African Music',                ['Ethiopic Music','Nubian Music','Oromo Music','Somali Music']],
		['Seychelles & Mascarene Islands Music',      ['Maloya','Moutya','Santé engagé','Séga']],
		['Southern African Music',                    ['Amapiano','Bulawayo Jazz','Cape Jazz','Chimurenga','Famo','Gqom','Isicathamiya','Jit','Kwaito','Marabi','Maskandi','Mbube','Shangaan Electro','Southern African Folk Music','Sungura','Township Bubblegum','Township Jive','Tsonga Disco']],
		['West African Music',                        ['Afrobeat','Afro-Funk','Afro-Rock','Akan Music','Balani Show','Dagomba Music','Ewe Music','Fon Music','Fula Music','Griot Music','Gumbe','Hausa Music','Highlife','Hipco','Hiplife','Igbo Music','Kabye Folk Music','Kru Music','Mande Music','Mossi Music','Songhai Music','Wassoulou','Wolof Music','Yoruba Music','Zouglou']],
		['Raï',                                       ['Pop Raï','Traditional Raï']],
		['Shaabi',                                    ['Mahraganat']],
		['Central Asian Music',                       ['Altai Traditional Music','Balochi Music','Bashkir Folk Music','Burushaski Folk Music','Buryat Folk Music','Central Asian Throat Singing','Hazara Folk Music','Karakalpak Traditional Music','Kazakh Music','Khakas Traditional Music','Kyrgyz Traditional Music','Mongolian Music','Pamiri Music','Pashto Folk Music','Shashmaqam','Sufiana kalam','Tajik Music','Tibetan Music','Turkmen Music','Uyghur Music','Uzbek Music']],
		['East Asian Music',                          ['Ainu Music','Chinese Music','East Asian Classical Music','East Asian Folk Music','Japanese Music','Korean Music','Okinawan Music','Vietnamese Music']],
		['North Asian Music',                         ['Ainu Music','Altai Traditional Music','Buryat Folk Music','Chukchi Folk Music','Khakas Traditional Music','Nivkh Music','Ob-Ugric Folk Music','Sakha Traditional Music','Samoyedic Folk Music','Tuvan Throat Singing']],
		['South Asian Music',                         ['Adhunik geet','Baila','Balochi Music','Bhangra','Filmi','Garba','Ginan','Indian Pop','Indo Jazz','Pop Ghazal','Rigsar','South Asian Classical Music','South Asian Folk Music','Sufiana kalam','Sufi Rock','Vedic Chant']],
		['Southeast Asian Music',                     ['Bamar Music','Hmong Pop','Indonesian Music','Khmer Music','Malay Music','Molam','Philippine Music','Southeast Asian Classical Music','Southeast Asian Folk Music','Stereo','Thai Music','Vietnamese Music','Xinyao']],
		['West Asian Music',                          ['Armenian Music','Azerbaijani Music','Balochi Music','Caucasian Music','Dabke','Druze Music','Iraqi Maqam','Levantine Arabic Music','Maftirim','Mesopotamian Music','Muzika mizrahit','Persian Music','Turkish Music','West Asian Folk Music']],
		['Calypso',                                   ['Calipso venezolano','Spouge']],
		['Cuban Music',                               ['Chachachá','Changüí','Conga','Cuban Charanga','Cubaton','Danzón','Descarga','Filin','Guajira','Guaracha','Habanera','Mambo','Mozambique','Pachanga','Pilón','Rumba cubana','Santería Music','Son cubano','Songo','Timba','Trova','Tumba francesa']],
		['French Caribbean Music',                    ['Biguine','Bouyon','Cadence Lypso','Dennery Segment','Gwo Ka','Haitian Music','Tumbélé','Zouk']],
		['Indo-Caribbean Music',                      ['Baithak gana','Chutney']],
		['Jamaican Music',                            ['Dancehall','Jamaican Ska','Mento','Nyahbinghi','Reggae','Rocksteady']],
		['Merengue',                                  ['Mambo urbano','Merecumbé','Merengue típico','Merenhouse','Tecnomerengue']],
		['Soca',                                      ['Bashment Soca','Chutney Soca','Dennery Segment','Power Soca','Rapso']],
		['Mass',                                      ['Requiem']],
		['Plainsong',                                 ['Ambrosian Chant','Canto beneventano','Canto mozárabe','Celtic Chant','Gregorian Chant','Old Roman Chant']],
		['Russian Orthodox Liturgical Music',         ['Choral Concerto','Znamenny Chant']],
		['Ashkenazi Music',                           ['Klezmer','Yiddish Folksong']],
		['Balkan Music',                              ['Balkan Folk Music','Balkan Pop-Folk','Entechna','Laika','Romanţe','Yu-Mex']],
		['British Music',                             ['British Brass Band','British Dance Band','British Folk Rock','Cornish Folk Music','English Folk Music','Music Hall','Scottish Folk Music','Welsh Folk Music']],
		['Caucasian Music',                           ['Caucasian Folk Music','Rabiz']],
		['Chanson',                                   ['Chanson alternative','Chanson à texte','Chanson réaliste','Nouvelle chanson française']],
		['German Music',                              ['German Folk Music','Guggenmusik','Lied','Liedermacher','Romantische Oper','Volkstümliche Musik','Zeitoper']],
		['Greek Music',                               ['Ancient Greek Music','Byzantine Music','Entechna','Greek Folk Music','Laika']],
		['Italian Music',                             ['Canto beneventano','Canzone d\u0027autore','Italian Folk Music','Old Roman Chant','Opera buffa','Opera semiseria','Opera seria']],
		['Polish Music',                              ['Disco polo','Mazur','Mazurka','Miejski folk','Poezja śpiewana','Polish Folk Music','Polonaise']],
		['Portuguese Music',                          ['Música de intervenção','Pimba','Portuguese Folk Music']],
		['Romanian Music',                            ['Manele','Muzică de mahala','Romanian Etno Music','Romanian Folk Music','Romanţe']],
		['Russian Music',                             ['Avtorskaya pesnya','Russian Chanson','Russian Folk Music','Russian Orthodox Liturgical Music','Russian Romance']],
		['Spanish Music',                             ['Bolero español','Flamenco','Flamenco Pop','Nueva canción española','Rock andaluz','Rumba catalana','Spanish Classical Music','Spanish Folk Music','Tecnorumba']],
		['Waltz',                                     ['Valsa brasileira']],
		['Hispanic American Music',                   ['Argentine Music','Bachata','Bailecito','Bolero','Boogaloo','Candombe beat','Caporal','Carnaval cruceño','Chamamé','Champeta','Chilean Music','Chuntunqui romántico','Conjunto andino','Cuban Music','Cumbia','Currulao','Dembow','Gaita zuliana','Guarania','Hispanic American Folk Music','Huayno','Latin Alternative','Latin American Classical Music','Latin Disco','Latin Electronic','Latin Funk','Latin Jazz','Latin Pop','Latin Rock','Latin Soul','Mambo chileno','Merengue','Mexican Music','Murga uruguaya','Nueva canción latinoamericana','Onda nueva','Pasillo','Peruvian Music','Polka paraguaya','Porro','Reggaetón','Rhumba','Rock andino','Salsa','Tamborera','Tango','Tropicanibalismo','Vallenato','Xuc']],
		['Indigenous Andean Music',                   ['Harawi','Huayno','Tonada potosina']],
		['Indigenous North American Music',           ['Athabaskan Fiddling','Inuit Music','James Bay Fiddling','Métis Music','Powwow Music']],
		['Hasidic Music',                             ['Nigun']],
		['Jewish Liturgical Music',                   ['Ancient Levitical Music','Chazzanut','Kriyat haTorah','Piyyut']],
		['Sephardic Music',                           ['Ladino Folksong','Maftirim']],
		['Americana',                                 ['Red Dirt']],
		['Greenlandic Music',                         ['Kalattut']],
		['Louisiana Music',                           ['Cajun Music','New Orleans Blues','New Orleans Brass Band','New Orleans R&B','Swamp Blues','Swamp Pop','Zydeco']],
		['Ragtime',                                   ['Cakewalk','Honky-Tonk Piano','Novelty Piano','Stride']],
		['Indigenous Australian Traditional Music',   ['Djanba']],
		['Melanesian Music',                          ['Fijian Music','Kaneka','Lokal musik','Papuan Folk Music','Tolai Rock']],
		['Micronesian Music',                         ['Kantan Chamorrita']],
		['Polynesian Music',                          ['Fijian Music','Hawaiian Music','Himene tarava','Māori Music','Samoan Music','Tahitian Music']],
		['Argentine Music',                           ['Cuarteto','Cumbia argentina','Nuevo Cancionero']],
		['Brazilian Music',                           ['Bandinha','Bossa nova','Brazilian Classical Music','Brazilian Folk Music','Brega','Choro','Dobrado','Funk brasileiro','Maxixe','MPB','Música gaúcha','Northeastern Brazilian Music','Northern Brazilian Music','Rock rural','Samba','Samba-jazz','Sertanejo','Vanguarda paulista','Xote']],
		['Chilean Music',                             ['Canto a lo poeta','Chilote Music','Cumbia chilena','Jazz guachaca','Música cebolla','Neofolklore','Nueva canción chilena','Tonada chilena']],
		['Peruvian Music',                            ['Música criolla peruana']],
		['Tango',                                     ['Finnish Tango','Tango nuevo']],
		['Central Asian Throat Singing',              ['Mongolian Throat Singing','Tuvan Throat Singing']],
		['Indie Rock',                                ['C86','Dunedin Sound','Garage Rock Revival','Hamburger Schule','Indie Surf','Math Pop','Midwest Emo','New Rave','Noise Pop','Post-Punk Revival','Slacker Rock','Slowcore','Twee Pop']],
		['Avant-Prog',                                ['Brutal Prog','Rock in Opposition','Zeuhl']],
		['Rockabilly',                                ['Psychobilly']],
		['Surf Rock',                                 ['Eleki','Rautalanka','Wong shadow']],
		['Nueva canción latinoamericana',             ['Nueva canción chilena','Nueva trova','Nuevo Cancionero']],
		['Animal Sounds',                             ['Birdsong','Insect Sounds','Whale Song']],
		['Chinese Opera',                             ['Cantonese Opera','Henan Opera','Peking Opera','Shaoxing Opera']],
		['Sōkyoku',                                   ['Danmono','Kumiuta']],
		['Jeong-ak',                                  ['Gagok']],
		['Balinese Gamelan',                          ['Gamelan angklung','Gamelan beleganjur','Gamelan gender wayang','Gamelan gong gede','Gamelan gong kebyar','Gamelan jegog','Gamelan selonding','Gamelan semar pegulingan']],
		['Javanese Gamelan',                          ['Gamelan sekaten']],
		['Minimalism',                                ['Holy Minimalism']],
		['Post-Minimalism',                           ['Totalism']],
		['Serialism',                                 ['Integral Serialism']],
		['Zarzuela',                                  ['Género chico','Zarzuela barroca','Zarzuela grande']],
		['Concerto',                                  ['Concerto for Orchestra','Concerto grosso','Sinfonia concertante']],
		['Symphony',                                  ['Choral Symphony','Sinfonia concertante']],
		['Italo-Disco',                               ['Spacesynth']],
		['Breakbeat Hardcore',                        ['Darkside','Hardcore Breaks']],
		['Breakbeat Kota',                            ['Jungle Dutch']],
		['Darkstep',                                  ['Crossbreed','Skullstep']],
		['Jungle',                                    ['Ragga Jungle']],
		['Liquid Drum and Bass',                      ['Sambass']],
		['Brostep',                                   ['Briddim','Colour Bass','Deathstep','Drumstep','Tearout [Brostep]']],
		['Riddim',                                    ['Future Riddim']],
		['Breakcore',                                 ['Lolicore','Mashcore','Raggacore']],
		['Gabber',                                    ['Nu Style Gabber']],
		['Happy Hardcore',                            ['Bouncy Techno','UK Hardcore']],
		['Hardtek',                                   ['Raggatek']],
		['Speedcore',                                 ['Extratone','Splittercore']],
		['Hardstyle',                                 ['Dubstyle','Euphoric Hardstyle','Psystyle','Rawstyle']],
		['UK Hardcore',                               ['Powerstomp']],
		['UK Hard House',                             ['Scouse House','Speed House']],
		['Amapiano',                                  ['Afropiano']],
		['Bass House',                                ['Speed House']],
		['Brazilian Bass',                            ['Mega funk','Slap House']],
		['Chicago Hard House',                        ['LA Hard House']],
		['Deep House',                                ['Lo-Fi House']],
		['Diva House',                                ['Hardbag']],
		['Electro House',                             ['Complextro','Dutch House','Fidget House','French Electro','Melbourne Bounce']],
		['Euro House',                                ['Hardbag']],
		['Future House',                              ['Future Bounce','Slap House']],
		['Garage House',                              ['Gospel House','Jersey Sound']],
		['Ghetto House',                              ['Juke']],
		['Outsider House',                            ['Lo-Fi House']],
		['Tech House',                                ['Deep Tech','Rominimal']],
		['Tribal House',                              ['Guaracha [EDM]']],
		['Hard Techno',                               ['Schranz']],
		['Minimal Techno',                            ['Dub Techno']],
		['Euro-Trance',                               ['Hands Up']],
		['Psytrance',                                 ['Dark Psytrance','Forest Psytrance','Full-On Psytrance','Goa Trance','Progressive Psytrance','Suomisaundi']],
		['Tracker Music',                             ['Doskpop']],
		['Ngoma',                                     ['Unyago']],
		['Southern African Folk Music',               ['Afrikaner Folk Music','Khoisan Folk Music','Nguni Folk Music','Shona Mbira Music','Sotho-Tswana Folk Music']],
		['Appalachian Folk Music',                    ['Old-Time']],
		['Aboio',                                     ['Aboio cantado']],
		['Cantoria',                                  ['Repente']],
		['Jongo',                                     ['Ponto de umbanda']],
		['Sertanejo de raiz',                         ['Moda de viola']],
		['Canadian Maritime Folk',                    ['Cape Breton Folk Music']],
		['Dagestani Folk Music',                      ['Avar Folk Music']],
		['Chinese Folk Music',                        ['Han Folk Music','Jiangnan sizhu','Shan’ge']],
		['Japanese Folk Music',                       ['Amami shimauta','Heikyoku','Kagura','Kouta','Min\u0027yō','Ondō','Rōkyoku','Taiko','Tsugaru shamisen']],
		['Korean Folk Music',                         ['Pansori','Pungmul','Sanjo','Sinawi']],
		['Vietnamese Folk Music',                     ['Chèo','Quan họ','Xẩm']],
		['Alpine Folk Music',                         ['Narodno zabavna glasba','Naturjodel']],
		['Balkan Folk Music',                         ['Albanian Folk Music','Aromanian Folk Music','Balkan Brass Band','Bosnian Folk Music','Bulgarian Folk Music','Croatian Folk Music','Csango Folk Music','Gagauz Folk Music','Ganga','Greek Folk Music','Macedonian Folk Music','Montenegrin Folk Music','Muzică lăutărească','Serbian Folk Music','Starogradska muzika']],
		['Baltic Folk Music',                         ['Latvian Folk Music','Lithuanian Folk Music']],
		['Balto-Finnic Folk Music',                   ['Estonian Folk Music','Finnish Folk Music','Karelian Folk Music','Livonian Folk Music','Rune Singing']],
		['Catalan Folk Music',                        ['Sardana']],
		['Celtic Folk Music',                         ['Asturian Folk Music','Breton Celtic Folk Music','Cape Breton Folk Music','Cornish Folk Music','Galician Folk Music','Irish Folk Music','Manx Folk Music','Scottish Folk Music','Trás-os-Montes Folk Music','Welsh Folk Music']],
		['English Folk Music',                        ['Northumbrian Folk Music','Scrumpy and Western']],
		['French Folk Music',                         ['Alsatian Folk Music','Breton Folk Music','Corsican Folk Music','Musette','Occitan Folk Music']],
		['Hungarian Folk Music',                      ['Csárdás']],
		['Italian Folk Music',                        ['Canzone napoletana','Liscio','Stornello','Tarantella','Trallalero']],
		['Neo-Medieval Folk',                         ['Bardcore']],
		['Nordic Folk Music',                         ['Danish Folk Music','Faroese Folk Music','Finnish Folk Music','Icelandic Folk Music','Joik','Nordic Old Time Dance Music','Norwegian Folk Music','Swedish Folk Music']],
		['Portuguese Folk Music',                     ['Cante alentejano','Chamarrita açoriana','Fado','Trás-os-Montes Folk Music']],
		['Romanian Folk Music',                       ['Bocet','Colinde','Doină','Muzică lăutărească']],
		['Sardinian Folk Music',                      ['Cantu a chiterra','Cantu a tenore']],
		['Slavic Folk Music',                         ['Belarusian Folk Music','Bosnian Folk Music','Bulgarian Folk Music','Croatian Folk Music','Czech Folk Music','Ganga','Goral Music','Macedonian Folk Music','Montenegrin Folk Music','Moravian Folk Music','Polish Folk Music','Russian Folk Music','Serbian Folk Music','Slovak Folk Music','Slovenian Folk Music','Starogradska muzika','Ukrainian Folk Music']],
		['Spanish Folk Music',                        ['Andalusian Folk Music','Aragonese Folk Music','Asturian Folk Music','Canarian Folk Music','Chotis madrileño','Copla','Cuplé','Galician Folk Music','Pasodoble']],
		['Volga-Ural Folk Music',                     ['Bashkir Folk Music','Chuvash Folk Music','Komi Folk Music','Mari Folk Music','Mordvin Folk Music','Udmurt Folk Music','Volga Tatar Folk Music']],
		['Mexican Folk Music',                        ['Canto cardenche','Son calentano','Son huasteco','Son istmeño','Son jarocho','Trova yucateca']],
		['Música criolla peruana',                    ['Marinera','Tondero','Vals criollo']],
		['Bengali Folk Music',                        ['Baul gaan']],
		['Bhojpuri Folk Music',                       ['Biraha']],
		['Kirtan',                                    ['Shabad kirtan']],
		['Sinhalese Folk Music',                      ['Sarala gee']],
		['Tamil Folk Music',                          ['Urumi melam']],
		['Hill Tribe Music',                          ['Hmong Folk Music']],
		['Thai Folk Music',                           ['Fon leb']],
		['Armenian Folk Music',                       ['Kef Music']],
		['Turkish Folk Music',                        ['Turkish Black Sea Region Folk Music','Uzun Hava','Zeybek']],
		['Chicago Drill',                             ['Bop']],
		['PluggnB',                                   ['Asian Rock']],
		['Crust Punk',                                ['Blackened Crust','Neocrust','Stenchcore']],
		['Skacore',                                   ['Crack Rock Steady']],
		['Kizomba',                                   ['Tarraxinha']],
		['Soukous',                                   ['Kwassa kwassa']],
		['Amazigh Music',                             ['Ahwash','Izlan','Kabyle Music','Sahrawi Music','Staïfi','Tuareg Music']],
		['Ethiopic Music',                            ['Azmari','Ethio-Jazz','Ethiopian Church Music','Manzuma','Tigrinya Music','Tizita']],
		['Somali Music',                              ['Belwo','Dhaanto','Qaraami']],
		['Maloya',                                    ['Maloya élektrik','Traditional Maloya']],
		['Séga',                                      ['Seggae','Traditional Séga']],
		['Akan Music',                                ['Zoblazo']],
		['Ewe Music',                                 ['Agbadza','Agbekor']],
		['Fon Music',                                 ['Tchinkoumé','Tchink System','Zinli']],
		['Highlife',                                  ['Burger-Highlife']],
		['Kru Music',                                 ['Alloukou','Palm Wine Music','Ziglibithy']],
		['Wolof Music',                               ['Mbalax','Tassu']],
		['Yoruba Music',                              ['Apala','Fuji','Jùjú','Santería Music','Waka','Yoruba Folk Opera']],
		['Zouglou',                                   ['Coupé-décalé']],
		['Mongolian Music',                           ['Bogino duu','Kalmyk Music','Mongolian Throat Singing','Urtiin duu','Zohioliin duu']],
		['Pamiri Music',                              ['Falak']],
		['Tibetan Music',                             ['Zhabdro gorgom']],
		['Ainu Music',                                ['Upopo','Yukar']],
		['Chinese Music',                             ['Ancient Chinese Music','Campus Folk','Chinese Classical Music','Chinese Folk Music','Minyue','Quyi','Shidaiqu','Xinyao','Zhongguo feng']],
		['Japanese Music',                            ['Enka','Japanese Classical Music','Japanese Folk Music','Ryūkōka']],
		['Korean Music',                              ['Fusion Gugak','Korean Classical Music','Korean Folk Music','Korean Revolutionary Opera','Oriental Ballad','Trot']],
		['Vietnamese Music',                          ['Bolero Việt Nam','Cải lương','Nhạc đỏ','Nhạc vàng','Vietnamese Classical Music','Vietnamese Folk Music']],
		['Bhangra',                                   ['Folkhop']],
		['Bamar Music',                               ['Bamar Folk Music','Burmese Classical Music','Mono']],
		['Indonesian Music',                          ['Balinese Music','Dangdut','Gambang kromong','Javanese Music','Keroncong','Minangkabau Music','Orkes gambus','Pop Batak','Qasidah modern','Rapai dabõih','Sundanese Music','Tanjidor']],
		['Khmer Music',                               ['Cambodian Pop','Khmer Folk Music','Pinpeat']],
		['Malay Music',                               ['Malay Classical Music','Malay Folk Music']],
		['Molam',                                     ['Molam sing']],
		['Philippine Music',                          ['Balitaw','Filipino Rondalla','Kundiman','Pinoy Folk Rock']],
		['Thai Music',                                ['Luk krung','Luk thung','Molam sing','Phleng phuea chiwit','Thai Classical Music','Thai Folk Music','Wong shadow']],
		['Armenian Music',                            ['Armenian Church Music','Armenian Folk Music','Rabiz']],
		['Azerbaijani Music',                         ['Azerbaijani Mugham','Jazz Mugham','Meyxana']],
		['Persian Music',                             ['Bandari','Persian Classical Music','Persian Folk Music','Persian Pop']],
		['Turkish Music',                             ['Anatolian Rock','Arabesk','Fantezi','Kanto','Ottoman Military Music','Özgün Müzik','Turkish Classical Music','Turkish Folk Music','Turkish Pop']],
		['Rumba cubana',                              ['Guaguancó']],
		['Son cubano',                                ['Bolero son']],
		['Trova',                                     ['Nueva trova']],
		['Haitian Music',                             ['Cadence rampa','Compas','Haitian Vodou Drumming','Méringue','Rabòday','Rara','Rasin']],
		['Zouk',                                      ['Cabo-Zouk','Zouk Love']],
		['Chutney',                                   ['Chutney Soca']],
		['Dancehall',                                 ['Bubbling','Digital Dancehall','Flex Dance Music','Gommance','Ragga','Shatta','Zess']],
		['Reggae',                                    ['Deejay','Digital Dancehall','Dub','Lovers Rock','Pacific Reggae','Pop Reggae','Roots Reggae','Seggae','Skinhead Reggae']],
		['Entechna',                                  ['Entechna laika','Neo Kyma']],
		['Laika',                                     ['Entechna laika','Modern Laika','Skiladika']],
		['Scottish Folk Music',                       ['Òrain Ghàidhlig','Pìobaireachd','Pipe Band','Scots Song','Shetland & Orkney Folk Music']],
		['Greek Folk Music',                          ['Aegean Islands Folk Music','Cretan Folk Music','Dimotika','Ionian Islands Folk Music','Rembetika']],
		['Polish Folk Music',                         ['Folklor miejski','Kashubian Folk Music','Krakowiak','Kujawiak','Kurpian Folk Music','Oberek','Polish Goral Music']],
		['Flamenco',                                  ['Bulería','Flamenco nuevo','Rumba flamenca']],
		['Bolero',                                    ['Bolero son','Filin']],
		['Cumbia',                                    ['Cumbia argentina','Cumbia chilena','Cumbia colombiana','Cumbia mexicana','Cumbia peruana','Cumbia pop','Digital Cumbia','Merecumbé']],
		['Huayno',                                    ['Bolivian Huayño','Carnavalito']],
		['Mexican Music',                             ['Bandas de viento de México','Chilena','Corrido','Cumbia mexicana','Cumbiatón','Mariachi','Mexican Folk Music','Norteño','Ranchera','Tejano Music']],
		['Reggaetón',                                 ['Bachatón','Cubaton','Cumbiatón','Neoperreo','RKT']],
		['Salsa',                                     ['Salsa choke','Salsa dura','Salsa romántica','Timba']],
		['Inuit Music',                               ['Inuit Vocal Games']],
		['Cajun Music',                               ['Traditional Cajun Music']],
		['Zydeco',                                    ['Nouveau zydeco']],
		['Fijian Music',                              ['Vude']],
		['Hawaiian Music',                            ['Hapa haole','Slack-Key Guitar']],
		['Cumbia argentina',                          ['Cumbia santafesina','Cumbia turra','Cumbia villera']],
		['Brega',                                     ['Arrocha','Brega calypso','Brega funk','Tecnobrega']],
		['Choro',                                     ['Samba-choro']],
		['Funk brasileiro',                           ['Arrocha funk','Brega funk','Funk 150 bpm','Funk de BH','Funk mandelão','Funk melody','Funk ostentação','Funk proibidão','Mega funk','Rasteirinha','Tamborzão','Tecnofunk']],
		['MPB',                                       ['Tropicália']],
		['Música gaúcha',                             ['Vanera']],
		['Northeastern Brazilian Music',              ['Aboio','Afoxé','Arrocha','Axé','Baião','Banda de pífano','Brega funk','Cantoria','Coco','Forró','Frevo','Manguebeat','Maracatu','Samba de roda','Unakesa']],
		['Northern Brazilian Music',                  ['Brega calypso','Carimbó','Lambada','Tecnobrega']],
		['Samba',                                     ['Batucada','Marchinha','Pagode','Partido alto','Samba-canção','Samba-choro','Samba de breque','Samba de gafieira','Samba de roda','Samba de terreiro','Samba-enredo','Samba-exaltação','Samba-joia','Sambalanço','Samba-rock']],
		['Sertanejo',                                 ['Rasqueado','Sertanejo de raiz','Sertanejo romântico','Sertanejo universitário']],
		['Cumbia chilena',                            ['Nueva cumbia chilena']],
		['Slacker Rock',                              ['Shitgaze']],
		['Peking Opera',                              ['Korean Revolutionary Opera','Revolutionary Opera']],
		['Spacesynth',                                ['Doskpop']],
		['Rawstyle',                                  ['Rawphoric']],
		['Scouse House',                              ['Hardbass']],
		['Dark Psytrance',                            ['Hi-Tech Psytrance','Psycore']],
		['Goa Trance',                                ['Nitzhonot']],
		['Progressive Psytrance',                     ['Zenonesque']],
		['Cape Breton Folk Music',                    ['Cape Breton Fiddling']],
		['Albanian Folk Music',                       ['Lab Polyphony','Musika popullore','Tosk Polyphony']],
		['Bosnian Folk Music',                        ['Izvorna bosanska muzika','Sevdalinka']],
		['Croatian Folk Music',                       ['Klapa']],
		['Macedonian Folk Music',                     ['Čalgija']],
		['Starogradska muzika',                       ['Čalgija']],
		['Lithuanian Folk Music',                     ['Sutartinės']],
		['Estonian Folk Music',                       ['Seto leelo']],
		['Rune Singing',                              ['Seto leelo']],
		['Breton Celtic Folk Music',                  ['Bagad']],
		['Irish Folk Music',                          ['Sean-nós']],
		['Breton Folk Music',                         ['Breton Celtic Folk Music']],
		['Corsican Folk Music',                       ['Paghjella']],
		['Musette',                                   ['Swing musette']],
		['Occitan Folk Music',                        ['Auvergnat Folk Music','Gascon Folk Music']],
		['Tarantella',                                ['Pizzica','Tammurriata']],
		['Nordic Old Time Dance Music',               ['Polska']],
		['Swedish Folk Music',                        ['Hambo']],
		['Fado',                                      ['Fado de Coimbra']],
		['Goral Music',                               ['Polish Goral Music']],
		['Slovenian Folk Music',                      ['Narodno zabavna glasba']],
		['Ukrainian Folk Music',                      ['Duma','Hutsul Folk Music']],
		['Andalusian Folk Music',                     ['Saeta','Sevillanas']],
		['Tuareg Music',                              ['Takamba','Tishoumaren']],
		['Trot',                                      ['Pon-chak disco','Semi-Trot']],
		['Balinese Music',                            ['Balinese Gamelan','Kecak']],
		['Javanese Music',                            ['Campursari','Javanese Gamelan','Kuda kepang','Langgam Jawa']],
		['Keroncong',                                 ['Cilokaq','Langgam Jawa']],
		['Minangkabau Music',                         ['Pop Minang','Saluang klasik','Talempong']],
		['Sundanese Music',                           ['Gamelan degung','Jaipongan','Kacapi suling','Ketuk tilu','Kliningan','Pop Sunda','Tembang Sunda Cianjuran']],
		['Luk krung',                                 ['Lilat']],
		['Dub',                                       ['Novo Dub']],
		['Roots Reggae',                              ['Dub Poetry']],
		['Òrain Ghàidhlig',                           ['Òrain luaidh','Seinn nan salm']],
		['Cretan Folk Music',                         ['Rizitika']],
		['Folklor miejski',                           ['Warsaw City Folk']],
		['Flamenco nuevo',                            ['Flamenco Jazz']],
		['Cumbia mexicana',                           ['Cumbia sonidera']],
		['Bandas de viento de México',                ['Banda sinaloense']],
		['Norteño',                                   ['Cumbia norteña mexicana','Duranguense','Movimiento alterado','Sierreño']],
		['Arrocha',                                   ['Arrochadeira','Bregadeira']],
		['Brega funk',                                ['Batidão romântico']],
		['Funk mandelão',                             ['Beat bruxaria']],
		['Axé',                                       ['Pagodão','Samba-reggae']],
		['Coco',                                      ['Ciranda','Embolada']],
		['Forró',                                     ['Forró eletrônico','Forró universitário']],
		['Lambada',                                   ['Guitarrada']],
		['Pagode',                                    ['Pagodão','Pagode romântico']],
		['Samba-rock',                                ['Samba Soul']],
		['Polska',                                    ['Hambo']],
		['Banda sinaloense',                          ['Movimiento alterado','Tecnobanda']],
		['Sierreño',                                  ['Corrido tumbado']],
		['Pagodão',                                   ['Arrochadeira']],
		['Forró eletrônico',                          ['Piseiro']],

		['Ambient Pop',                               []],
		['ASMR',                                      []],
		['Beatboxing',                                []],
		['Bugle Call',                                []],
		['Dark Cabaret',                              []],
		['Mashup',                                    []],
		['Mechanical Music',                          []],
		['Visual kei',                                []],

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