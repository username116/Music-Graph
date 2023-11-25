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

		// what is called 'subgenres' in MusicBrainz

		['acoustic blues',              ['jug band']],
		['afrobeats',                   ['afropiano','alté']],
		['alternative country',         ['gothic country']],
		['alternative dance',           ['madchester','new rave']],
		['alternative metal',           ['neue deutsche härte','nu metal','rap metal']],
		['alternative rock',            ['britpop','dream pop','emo','geek rock','grebo','grunge','indie rock','j-rock','lo-fi','post-britpop','post-grunge','shoegaze']],
		['ambient',                     ['ambient americana','kankyō ongaku','space ambient','tribal ambient']],
		['andalusian classical',        ['malouf']],
		['animal sounds',               ['birdsong','whale song']],
		['art song',                    ['lied','lute song','mélodie','orchestral song','russian romance']],
		['avant-prog',                  ['zeuhl']],
		['balinese gamelan',            ['gamelan angklung','gamelan beleganjur','gamelan gender wayang','gamelan gong gede','gamelan gong kebyar','gamelan jegog','gamelan joged bumbung','gamelan selunding','gamelan semar pegulingan']],
		['ballad',                      ['latin ballad']],
		['ballet',                      ['ballet de cour']],
		['banda sinaloense',            ['technobanda']],
		['beat music',                  ['group sounds','jovem guarda','merseybeat','nederbeat']],
		['beijing opera',               ['chinese revolutionary opera']],
		['big band',                    ['experimental big band']],
		['bit music',                   ['bytebeat','chiptune','doskpop','fm synthesis']],
		['black metal',                 ['atmospheric black metal','black \u0027n\u0027 roll','depressive black metal','melodic black metal','pagan black metal','symphonic black metal','war metal']],
		['bluegrass',                   ['bluegrass gospel','progressive bluegrass']],
		['blues',                       ['acoustic blues','african blues','boogie-woogie','british blues','chicago blues','classic blues','country blues','delta blues','electric blues','hill country blues','jump blues','louisiana blues','modern blues','new orleans blues','piano blues','soul blues','texas blues']],
		['blues rock',                  ['boogie rock']],
		['bolero',                      ['filin']],
		['brass band',                  ['british brass band']],
		['breakbeat',                   ['acid breaks','big beat','breakbeat hardcore','breakbeat kota','florida breaks','nu skool breaks','progressive breaks','psybreaks','west coast breaks']],
		['breakbeat hardcore',          ['darkcore','hardcore breaks']],
		['breakbeat kota',              ['jungle dutch']],
		['breakcore',                   ['lolicore','mashcore','raggacore']],
		['brega',                       ['brega calypso','tecnobrega']],
		['brega funk',                  ['batidão romântico']],
		['brostep',                     ['briddim','colour bass','deathstep','riddim dubstep','tearout brostep']],
		['brutal death metal',          ['slam death metal']],
		['c-pop',                       ['cantopop','mandopop','zhongguo feng']],
		['calypso',                     ['calipso venezolano']],
		['canción melódica',            ['bolero-beat','música cebolla']],
		['cantoria',                    ['repente']],
		['celtic',                      ['cape breton fiddling','irish folk']],
		['chanson française',           ['chanson à texte','chanson réaliste']],
		['chicago blues',               ['acoustic chicago blues']],
		['chinese classical',           ['baisha xiyue','chinese opera','dongjing','yayue']],
		['chinese opera',               ['beijing opera','cantonese opera','henan opera','korean revolutionary opera','yue opera']],
		['church music',                ['anglican chant','byzantine chant','kyivan chant','plainchant','zema','znamenny chant']],
		['classical',                   ['andalusian classical','chinese classical','guoyue','indian classical','islamic modal music','japanese classical','korean classical','persian classical','pìobaireachd','shashmaqam','southeast asian classical','sufiana kalam','vietnamese classical','western classical']],
		['coco',                        ['embolada']],
		['comedy',                      ['break-in','prank calls','sketch comedy','standup comedy']],
		['comedy hip hop',              ['chap hop']],
		['concerto',                    ['concerto for orchestra','concerto grosso']],
		['contemporary christian',      ['praise & worship']],
		['contemporary classical',      ['post-classical']],
		['contemporary country',        ['neo-traditional country']],
		['contemporary folk',           ['alternative folk','american primitive guitar','anti-folk','avant-folk','chamber folk','filk','indie folk','neofolk','neofolklore','progressive folk','psychedelic folk','stomp and holler']],
		['contemporary r&b',            ['alternative r&b','hip hop soul','new jack swing','uk street soul']],
		['corrido',                     ['narcocorrido']],
		['country',                     ['alternative country','bakersfield sound','bluegrass','classic country','contemporary country','country yodeling','honky tonk','nashville sound','progressive country','red dirt','texas country','traditional country','truck driving country','urban cowboy','western (cowboy/western country)','western swing']],
		['country blues',               ['piedmont blues']],
		['country pop',                 ['bro-country','countrypolitan']],
		['crust punk',                  ['blackened crust','neocrust','stenchcore']],
		['cumbia',                      ['cumbia argentina','cumbia chilena','cumbia colombiana','cumbia mexicana','cumbia peruana','nueva cumbia chilena']],
		['cumbia argentina',            ['cumbia pop','cumbia santafesina','cumbia turra','cumbia villera']],
		['cumbia mexicana',             ['cumbia sonidera']],
		['d-beat',                      ['raw punk']],
		['dance',                       ['electro','eurobeat','eurodance']],
		['dance-pop',                   ['romanian popcorn','tecnorumba','township bubblegum']],
		['dancehall',                   ['flex dance music','gommance','ragga','shatta','zess']],
		['dangdut',                     ['koplo']],
		['dark ambient',                ['black ambient','ritual ambient']],
		['dark electro',                ['aggrotech']],
		['dark psytrance',              ['hi-tech','psycore']],
		['dark wave',                   ['ethereal wave','neoclassical dark wave']],
		['darkstep',                    ['skullstep']],
		['death metal',                 ['blackened death metal','brutal death metal','death \u0027n\u0027 roll','melodic death metal','old school death metal','technical death metal']],
		['denpa',                       ['moe song']],
		['disco',                       ['boogie','electro-disco','euro-disco','latin disco']],
		['diva house',                  ['hardbag']],
		['doom metal',                  ['death-doom metal','funeral doom metal','traditional doom metal']],
		['downtempo',                   ['trip hop']],
		['drill',                       ['chicago drill','jersey drill','uk drill']],
		['drum and bass',               ['atmospheric drum and bass','dancefloor drum and bass','darkstep','drill and bass','drumfunk','drumstep','dubwise','halftime','hardstep','jazzstep','jump up','jungle','liquid funk','minimal drum and bass','neurofunk','techstep','trancestep']],
		['dub',                         ['novo dub']],
		['dubstep',                     ['brostep','chillstep','dungeon sound','melodic dubstep','purple sound','tearout (older dubstep subgenre)']],
		['dungeon synth',               ['comfy synth','winter synth']],
		['easy listening',              ['cocktail nation','exotica','lounge','space age pop']],
		['ebm',                         ['new beat']],
		['edm',                         ['artcore','balani show','baltimore club','bérite club','breakbeat','breakcore','broken beat','bubblegum bass','bubbling','budots','coupé-décalé','cruise','dariacore','dark disco','deconstructed club','drum and bass','dubstep','electro latino','electroclash','footwork','footwork jungle','freestyle','funkot','future bass','future rave','ghettotech','glitch hop edm','grime','hands up','hard drum','hard nrg','hardcore techno','hardstyle','house','jersey club','jumpstyle','jungle terror','kuduro','lento violento','manyao','midtempo bass','moombahcore','moombahton','nerdcore techno','nortec','ori deck','philly club','rave','shangaan electro','singeli','spacesynth','techno','trance','trap edm','tribal guarachero','uk funky','uk garage']],
		['electric blues',              ['electric texas blues','swamp blues']],
		['electro',                     ['skweee']],
		['electro house',               ['complextro','dutch house','fidget house','french electro','melbourne bounce']],
		['electro-disco',               ['hi-nrg','italo-disco','space disco']],
		['electro-industrial',          ['dark electro']],
		['electroacoustic',             ['acousmatic','musique concrète']],
		['electronic',                  ['algorave','bit music','black midi','celtic electronica','chillsynth','club','digital fusion','downtempo','drift phonk','dungeon synth','edm','electronica','experimental electronic','flashcore','folktronica','funktronica','futurepop','glitch','hexd','horror synth','idm','illbient','indietronica','leftfield','microsound','minatory','minimal wave','moogsploitation','nightcore','nu disco','nu jazz','progressive electronic','psybient','sampledelia','seapunk','synthwave','vaporwave','wave','witch house']],
		['emo',                         ['emocore','midwest emo']],
		['éntekhno',                    ['neo kyma']],
		['eurodance',                   ['bubblegum dance','italo dance']],
		['experimental',                ['conducted improvisation','data sonification','noise','plunderphonics','reductionism','sound art','sound collage','tape music']],
		['experimental electronic',     ['electroacoustic']],
		['experimental hip hop',        ['industrial hip hop']],
		['experimental rock',           ['krautrock','no wave']],
		['fado',                        ['fado de coimbra']],
		['fandango',                    ['fandango caiçara']],
		['field recording',             ['nature sounds']],
		['flamenco',                    ['bulería','nuevo flamenco','rumba flamenca']],
		['folk',                        ['appalachian folk','bagad','biraha','celtic','contemporary folk','falak','fife and drum blues','fijiri','música criolla','neo-medieval folk','néo-trad','old-time','pagan folk','scrumpy and western','seguidilla','sevdalinka','sevillanas','skiffle','stornello','sutartinės','tajaraste','talking blues','tarantella','trampská hudba','visa','waulking song','white voice','work song','xuc','yodeling']],
		['folk metal',                  ['celtic metal','medieval metal']],
		['folk pop',                    ['manele','tallava','turbo-folk']],
		['folk punk',                   ['celtic punk']],
		['folk rock',                   ['british folk rock','celtic rock','medieval rock','phleng phuea chiwit','rock rural']],
		['forró',                       ['forró eletrônico','forró universitário']],
		['forró eletrônico',            ['piseiro']],
		['free improvisation',          ['eai']],
		['full-on',                     ['night full-on']],
		['funk',                        ['afro-funk','brit funk','deep funk','electro-funk','go-go','latin funk','p-funk','porn groove','synth funk']],
		['funk carioca',                ['arrocha funk','funk de bh','funk mandelão','funk melody','funk ostentação','funk proibidão','mega funk','rasteirinha','tamborzão']],
		['funk mandelão',               ['beat bruxaria']],
		['future bass',                 ['future core','kawaii future bass']],
		['gabber',                      ['nu style gabber']],
		['gamelan',                     ['balinese gamelan','gamelan degung','javanese gamelan','malay gamelan']],
		['garage house',                ['gospel house']],
		['garage rock',                 ['garage rock revival']],
		['genge',                       ['gengetone']],
		['ghetto house',                ['juke']],
		['glitch hop edm',              ['ghetto funk','neurohop']],
		['goa trance',                  ['nitzhonot']],
		['goregrind',                   ['gorenoise','pornogrind']],
		['gospel',                      ['contemporary gospel','sacred steel','southern gospel','traditional black gospel']],
		['grime',                       ['weightless']],
		['grindcore',                   ['cybergrind','goregrind','mincecore']],
		['happy hardcore',              ['bouncy techno','uk hardcore']],
		['hard house',                  ['donk','hardbass']],
		['hard rock',                   ['glam metal','stoner rock']],
		['hardcore hip hop',            ['britcore','memphis rap']],
		['hardcore punk',               ['beatdown hardcore','burning spirits','crust punk','d-beat','melodic hardcore','noisecore','powerviolence','sasscore','street punk','thrashcore','uk82']],
		['hardcore techno',             ['acidcore','belgian techno','deathchant hardcore','doomcore','freeform hardcore','frenchcore','gabber','happy hardcore','hyper techno','industrial hardcore','j-core','modern hardtek','powerstomp','speedcore','terrorcore','uptempo hardcore']],
		['hardstyle',                   ['dubstyle','euphoric hardstyle','psystyle','rawstyle']],
		['harsh noise',                 ['harsh noise wall']],
		['harsh noise wall',            ['ambient noise wall']],
		['heavy metal',                 ['nwobhm','speed metal']],
		['highlife',                    ['burger-highlife']],
		['hindustani classical',        ['abhang','dhrupad','khyal','natya sangeet','tappa','thumri']],
		['hip hop',                     ['abstract hip hop','afro trap','afroswing','alternative hip hop','arabesk rap','battle rap','bongo flava','boom bap','bounce','chicano rap','chipmunk soul','chopped and screwed','christian hip hop','cloud rap','comedy hip hop','conscious hip hop','crunk','digicore','drumless hip hop','east coast hip hop','experimental hip hop','g-funk','gangsta rap','genge','hardcore hip hop','hipco','hiplife','horrorcore','hyphy','instrumental hip hop','jazz rap','jerk rap','lowend','miami bass','mobb music','nerdcore','old school hip hop','phonk','political hip hop','pop rap','punk rap','ratchet music','snap','southern hip hop','trap','turntablism','underground hip hop','west coast hip hop']],
		['house',                       ['acid house','afro house','amapiano','ambient house','balearic beat','ballroom house','bass house','big room house','brazilian bass','changa tuki','chicago house','deep house','diva house','electro house','euro house','festival progressive house','french house','funky house','future bounce','future funk','future house','g-house','garage house','ghetto house','gqom','hard house','hip house','italo house','jackin house','jersey sound','kwaito','latin house','melodic house','microhouse','organic house','outsider house','progressive house','slap house','speed house','tech house','tribal house','tropical house','uk jackin','vinahouse','vocal house']],
		['idm',                         ['drill and bass']],
		['indian classical',            ['carnatic classical','hindustani classical','odissi classical']],
		['indie pop',                   ['bedroom pop','c86','chamber pop','donosti sound','twee pop']],
		['indie rock',                  ['dunedin sound','hamburger schule','indie surf','noise pop','slacker rock','slowcore']],
		['indietronica',                ['chillwave','glitch pop']],
		['industrial',                  ['death industrial','electro-industrial','post-industrial']],
		['industrial metal',            ['cyber metal']],
		['industrial techno',           ['birmingham sound']],
		['instrumental hip hop',        ['lo-fi hip hop']],
		['irish folk',                  ['sean-nós']],
		['islamic modal music',         ['iraqi maqam','mugham','sawt','turkish classical']],
		['j-pop',                       ['akishibu-kei']],
		['j-rock',                      ['yakousei']],
		['jam band',                    ['livetronica']],
		['japanese classical',          ['gagaku','heikyoku','honkyoku','jiuta','jōruri','meiji shinkyoku','nagauta','noh','shōmyō','sōkyoku']],
		['javanese gamelan',            ['gamelan salendro','gamelan sekaten','gamelan siteran']],
		['jazz',                        ['afro-jazz','avant-garde jazz','bebop','big band','cape jazz','classic jazz','contemporary jazz','cool jazz','crime jazz','crossover jazz','dark jazz','dixieland','ethio-jazz','free jazz','gypsy jazz','hard bop','indo jazz','instrumental jazz','jazz fusion','jazz-funk','latin jazz','marabi','modal jazz','modern creative','orchestral jazz','post-bop','smooth jazz','soul jazz','stride','swing','vocal jazz']],
		['jungle',                      ['ragga jungle']],
		['kayōkyoku',                   ['idol kayō','mood kayō','techno kayō']],
		['keroncong',                   ['langgam jawa']],
		['kirtan',                      ['shabad kirtan']],
		['kizomba',                     ['tarraxinha']],
		['korean ballad',               ['oriental ballad']],
		['korean classical',            ['aak','dangak','gagok','hyangak','jeongak']],
		['kuduro',                      ['batida']],
		['laiko',                       ['modern laiko','skiladiko']],
		['lambada',                     ['guitarrada']],
		['latin',                       ['bachata','boogaloo','rhumba (US "ballroom rumba")']],
		['latin jazz',                  ['afro-cuban jazz']],
		['latin pop',                   ['tropipop']],
		['liquid funk',                 ['sambass']],
		['maloya',                      ['maloya élektrik']],
		['marabi',                      ['mbaqanga']],
		['march',                       ['circus march','funeral march']],
		['marching band',               ['drumline','fife and drum','pep band']],
		['mass',                        ['requiem']],
		['math rock',                   ['math pop']],
		['medieval',                    ['ars antiqua','ars nova','ars subtilior','medieval lyric poetry','plainchant']],
		['memphis rap',                 ['dungeon rap']],
		['merengue',                    ['mambo urbano','merengue típico','merenhouse','tecnomerengue']],
		['metal',                       ['alternative metal','avant-garde metal','black metal','christian metal','death metal','doom metal','drone metal','folk metal','gothic metal','groove metal','heavy metal','kawaii metal','neoclassical metal','pop metal','post-metal','power metal','progressive metal','sludge metal','southern metal','stoner metal','symphonic metal','thrash metal','trance metal','viking metal']],
		['metalcore',                   ['mathcore','melodic metalcore']],
		['miami bass',                  ['techno bass']],
		['minimal techno',              ['dub techno']],
		['minimal wave',                ['minimal synth']],
		['minimalism',                  ['holy minimalism']],
		['mod',                         ['mod revival']],
		['modal jazz',                  ['jazz mugham']],
		['modern classical',            ['expressionism','futurism','indeterminacy','microtonal classical','minimalism','musique concrète instrumentale','new complexity','post-minimalism','serialism','sonorism','spectralism','stochastic music','totalism']],
		['modern hardtek',              ['raggatek']],
		['mor lam',                     ['mor lam sing']],
		['murga',                       ['murga uruguaya']],
		['música criolla',              ['festejo','landó','marinera','polca criolla','vals criollo']],
		['musical',                     ['cabaret','chèo','industrial musical','minstrelsy','murga','music hall','revue','rock musical','vaudeville']],
		['nature sounds',               ['animal sounds']],
		['neo-psychedelia',             ['paisley underground','psichedelia occulta italiana']],
		['neofolk',                     ['dark folk']],
		['new age',                     ['andean new age','celtic new age','native american new age','neoclassical new age']],
		['new wave',                    ['neue deutsche welle','new romantic']],
		['ngoma',                       ['unyago']],
		['noise',                       ['black noise','harsh noise','power electronics']],
		['norteño',                     ['cumbia norteña mexicana','duranguense','movimiento alterado','sierreño']],
		['nueva canción',               ['nueva canción chilena','nueva canción española','nuevo cancionero']],
		['opera',                       ['ballad opera','grand opera','monodrama','opera buffa','opéra comique','opera semiseria','opera seria','operetta','romantische oper','singspiel','tragédie en musique','verismo','zeitoper']],
		['outsider house',              ['lo-fi house']],
		['pagode',                      ['pagode romântico']],
		['plainchant',                  ['ambrosian chant','beneventan chant','celtic chant','gregorian chant','mozarabic chant','old roman chant']],
		['plugg',                       ['dark plugg','pluggnb']],
		['pluggnb',                     ['asian rock']],
		['plunderphonics',              ['mad','ytpmv']],
		['poetry',                      ['beat poetry','cowboy poetry','dub poetry','jazz poetry','slam poetry','sound poetry']],
		['polka',                       ['schottische']],
		['pop',                         ['alternative pop','ambient pop','art pop','avant-garde pop','bardcore','baroque pop','brill building','bubblegum pop','c-pop','canción melódica','city pop','classical crossover','contemporary christian','dance-pop','dansband','dansktop','denpa','easy listening','electropop','europop','flamenco pop','hyperpop','hypnagogic pop','indian pop','indie pop','j-pop','jazz pop','jesus music','k-pop','kayōkyoku','korean ballad','latin pop','levenslied','mulatós','nederpop','neo-acoustic','nyū myūjikku','operatic pop','opm','orthodox pop','palingsound','persian pop','pop ghazal','pop kreatif','pop minang','progressive pop','psychedelic pop','q-pop','rom kbach','russian chanson','schlager','shibuya-kei','sophisti-pop','sundanese pop','sunshine pop','synth-pop','teen pop','traditional pop','v-pop','wong shadow','yé-yé']],
		['pop minang',                  ['talempong goyang']],
		['pop punk',                    ['easycore','neon pop punk','seishun punk']],
		['pop rap',                     ['chicago bop']],
		['pop rock',                    ['beat music','burmese stereo','jangle pop','manila sound','power pop','tropical rock']],
		['pop soul',                    ['motown']],
		['post-hardcore',               ['emo','emocore','nintendocore','screamo','swancore']],
		['post-industrial',             ['ebm','epic collage','martial industrial','power noise']],
		['post-punk',                   ['coldwave','dance-punk','post-punk revival']],
		['progressive bluegrass',       ['jamgrass']],
		['progressive country',         ['outlaw country']],
		['progressive electronic',      ['berlin school']],
		['progressive metal',           ['djent']],
		['progressive psytrance',       ['zenonesque']],
		['progressive rock',            ['avant-prog','brutal prog','crossover prog','neo-progressive rock','symphonic prog']],
		['psychedelic',                 ['neo-psychedelia']],
		['psychedelic folk',            ['freak folk','free folk']],
		['psychedelic rock',            ['acid rock','canterbury scene','heavy psych','raga rock','space rock','zamrock']],
		['psytrance',                   ['dark psytrance','forest psytrance','full-on','progressive psytrance','suomisaundi']],
		['punk',                        ['alternative punk','anarcho-punk','art punk','cowpunk','electropunk','folk punk','post-hardcore','punk rock']],
		['punk rock',                   ['deathrock','gypsy punk','hardcore punk','horror punk','könsrock','oi','pop punk','queercore','riot grrrl','skate punk','surf punk','viking rock']],
		['r&b',                         ['blue-eyed soul','british rhythm & blues','contemporary r&b','doo-wop','new orleans r&b','quiet storm','swamp pop']],
		['ragtime',                     ['novelty piano']],
		['raï',                         ['pop raï']],
		['rawstyle',                    ['rawphoric']],
		['reductionism',                ['lowercase','onkyo']],
		['reggae',                      ['dancehall','dub','gospel reggae','lovers rock','pacific reggae','reggae-pop','roots reggae','skinhead reggae']],
		['reggaeton',                   ['bachatón','cubatón','cumbiatón','neoperreo','rkt']],
		['regional mexicano',           ['banda sinaloense','canto cardenche','chilena','corrido','mariachi','norteño','ranchera','son calentano','son huasteco','son istmeño','son jarocho','tejano','trova yucateca']],
		['riddim dubstep',              ['future riddim']],
		['rock',                        ['acoustic rock','afro rock','alternative rock','anatolian rock','aor','arena rock','art rock','christian rock','classic rock','comedy rock','dance-rock','experimental rock','folk rock','freakbeat','garage rock','glam rock','gothic rock','hard rock','heartland rock','instrumental rock','jam band','jazz rock','latin rock','mainstream rock','mangue beat','math rock','miejski folk','mod','neo-rockabilly','new wave','noise rock','occult rock','piano rock','pop yeh-yeh','post-punk','post-rock','progressive rock','proto-punk','psychedelic rock','pub rock','punk blues','rautalanka','reggae rock','rock and roll','rock andaluz','rock andino','rock opera','rock urbano','roots rock','soft rock','southern rock','sufi rock','surf','swamp rock','symphonic rock','visual kei','zolo']],
		['rock and roll',               ['indorock','rockabilly']],
		['roots rock',                  ['tex-mex']],
		['rumba cubana',                ['guaguancó']],
		['runo song',                   ['seto leelo']],
		['salsa',                       ['salsa choke','salsa dura','salsa romántica','timba']],
		['samba',                       ['bossa nova','pagodão','pagode','partido alto','samba de breque','samba de gafieira','samba de roda','samba de terreiro','samba-canção','samba-enredo','samba-exaltação','samba-joia','samba-rock','sambalanço']],
		['samba-rock',                  ['samba soul']],
		['schlager',                    ['volkstümliche musik']],
		['screamo',                     ['emoviolence']],
		['serialism',                   ['integral serialism']],
		['sertanejo',                   ['sertanejo raiz','sertanejo romântico','sertanejo universitário']],
		['sertanejo raiz',              ['moda de viola']],
		['sertanejo universitário',     ['funknejo']],
		['shaabi',                      ['mahraganat']],
		['shibuya-kei',                 ['picopop']],
		['sierreño',                    ['corrido tumbado']],
		['singer-songwriter',           ['avtorskaya pesnya','euskal kantagintza berria','kleinkunst','liedermacher','música de intervenção','nova cançó','nueva canción']],
		['ska',                         ['2 tone','jamaican ska','third wave ska']],
		['ska punk',                    ['crack rock steady','skacore']],
		['slacker rock',                ['shitgaze']],
		['sludge metal',                ['atmospheric sludge metal']],
		['soca',                        ['bashment soca','dennery segment','power soca']],
		['soft rock',                   ['yacht rock']],
		['sōkyoku',                     ['danmono','kumiuta']],
		['son cubano',                  ['son montuno']],
		['soukous',                     ['kwassa kwassa']],
		['soul',                        ['chicago soul','deep soul','latin soul','neo soul','northern soul','philly soul','psychedelic soul','smooth soul','southern soul']],
		['sound effects',               ['binaural beats']],
		['southeast asian classical',   ['burmese classical','gamelan','kacapi suling','kulintang','mahori','pinpeat','saluang klasik','talempong','tembang cianjuran','thai classical']],
		['southern hip hop',            ['dirty south']],
		['speedcore',                   ['extratone','splittercore']],
		['spoken word',                 ['fairy tale','guided meditation','interview','lecture','speech']],
		['stoner rock',                 ['desert rock']],
		['surf',                        ['surf rock','vocal surf']],
		['surf rock',                   ['eleki']],
		['swing',                       ['swing revival']],
		['symphony',                    ['choral symphony']],
		['synth funk',                  ['minneapolis sound']],
		['synthwave',                   ['darksynth','sovietwave']],
		['tango',                       ['finnish tango','nuevo tango']],
		['tarantella',                  ['pizzica','tammurriata']],
		['tech house',                  ['deep tech','rominimal']],
		['technical death metal',       ['dissonant death metal']],
		['techno',                      ['acid techno','ambient techno','bleep techno','deep techno','detroit techno','free tekno','hard techno','hardgroove techno','industrial techno','makina','melodic techno','minimal techno','peak time techno','schranz','wonky techno']],
		['texas blues',                 ['acoustic texas blues','electric texas blues']],
		['thai classical',              ['fon leb','khrueang sai','piphat']],
		['thrash metal',                ['technical thrash metal']],
		['traditional country',         ['close harmony','country boogie','country gospel']],
		['traditional doom metal',      ['epic doom metal']],
		['traditional pop',             ['tin pan alley']],
		['trance',                      ['acid trance','ambient trance','balearic trance','big room trance','dream trance','euro-trance','goa trance','hard trance','melodic trance','progressive trance','psytrance','tech trance','vocal trance']],
		['trap',                        ['detroit trap','drill','no melody trap','plugg','regalia','sigilkore','trap latino','trap metal','trap shaabi','tread']],
		['trap edm',                    ['festival trap','hard trap','heaven trap','hybrid trap','twerk']],
		['tribal house',                ['guaracha edm (Colombian electronic genre)']],
		['trot',                        ['pon-chak disco','semi-trot']],
		['trova',                       ['nueva trova']],
		['turntablism',                 ['battle record']],
		['uk garage',                   ['2-step','bassline','breakstep','future garage','speed garage']],
		['vaporwave',                   ['barber beats','broken transmission','dreampunk','hardvapour','mallsoft','slushwave','utopian virtual','vaportrap']],
		['vietnamese classical',        ['ca trù','hát tuồng']],
		['vocal jazz',                  ['vocalese']],
		['waltz',                       ['slow waltz','valsa brasileira']],
		['wave',                        ['hardwave','neo-grime']],
		['western classical',           ['art song','ballet','baroque','baroque suite','brass band','cantata','cinematic classical','classical period','concert band','concerto','contemporary classical','divertissement','étude','fantasia','impressionism','madrigal','march','mass','medieval','modern classical','motet','neoclassicism','nocturne','opera','oratorio','overture','prelude','renaissance','ricercar','romantic classical','serenade','sinfonia concertante','sonata','symphonic poem','symphony','toccata','zarzuela']],
		['work song',                   ['aboio','sea shanty','shan\u0027ge']],
		['zarzuela',                    ['género chico','género grande','zarzuela barroca']],
		['zouk',                        ['afro-zouk','cabo zouk','zouk love']],
		['zydeco',                      ['nouveau zydeco']],

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

		// what is called 'has fusion genres' in MusicBrainz

		['alternative rock',          ['alternative dance']],
		['ambient',                   ['ambient dub']],
		['arrocha',                   ['arrocha sertanejo','arrochadeira']],
		['avtorskaya pesnya',         ['bard rock']],
		['ballet',                    ['opera-ballet']],
		['beat music',                ['candombe beat']],
		['bélé',                      ['biguine']],
		['bit music',                 ['bitpop']],
		['black metal',               ['blackgaze']],
		['blues',                     ['blues rock','jazz blues','vaudeville blues']],
		['blues rock',                ['desert blues']],
		['bolero',                    ['bolero son']],
		['bubbling',                  ['bubbling house']],
		['cadence rampa',             ['cadence lypso']],
		['calypso',                   ['axé','cadence lypso','spouge']],
		['candombe',                  ['candombe beat']],
		['canzone napoletana',        ['canzone neomelodica']],
		['choro',                     ['samba-choro']],
		['chutney',                   ['chutney soca']],
		['concerto',                  ['sinfonia concertante']],
		['contemporary folk',         ['country folk','folk pop']],
		['contemporary r&b',          ['trap soul']],
		['country',                   ['country and irish','country folk','country pop','country rap','country rock','country soul']],
		['crunk',                     ['crunkcore']],
		['cumbia',                    ['merecumbé']],
		['cumbia argentina',          ['digital cumbia']],
		['dance',                     ['alternative dance']],
		['dance-pop',                 ['chalga','disco polo']],
		['darkstep',                  ['crossbreed']],
		['death metal',               ['deathcore','deathgrind']],
		['drum and bass',             ['footwork jungle']],
		['dub',                       ['ambient dub']],
		['dubstep',                   ['wonky']],
		['edm',                       ['crunkcore','electronicore']],
		['electro house',             ['big room house']],
		['electronic',                ['digital cumbia','electro swing','electronic rock','electrotango']],
		['emo',                       ['emo pop','emo rap']],
		['folk',                      ['bhangra','chalga','desert blues','disco polo','world fusion']],
		['footwork',                  ['footwork jungle']],
		['forró',                     ['axé']],
		['frevo',                     ['axé']],
		['funk',                      ['acid jazz','afrobeat (funk/soul + West African sounds)','funk rock']],
		['funk carioca',              ['brega funk','tecnofunk']],
		['funk rock',                 ['funk metal']],
		['future house',              ['future bounce']],
		['garage rock',               ['garage punk']],
		['glam rock',                 ['glam punk']],
		['glitch hop',                ['wonky']],
		['grindcore',                 ['deathgrind']],
		['hardcore punk',             ['crossover thrash','digital hardcore','grindcore','metalcore','rapcore']],
		['hardcore techno',           ['crossbreed','digital hardcore']],
		['highlife',                  ['afrobeat (funk/soul + West African sounds)']],
		['hip hop',                   ['acid jazz','country rap','emo rap','glitch hop','ragga hip-hop','rap rock','rapcore','rapso']],
		['house',                     ['bubbling house']],
		['idm',                       ['glitch hop']],
		['industrial',                ['industrial metal','industrial rock']],
		['irish folk',                ['country and irish']],
		['jazz',                      ['acid jazz','afrobeat (funk/soul + West African sounds)','boogaloo','flamenco jazz','jazz blues','samba-jazz','third stream','world fusion']],
		['maracatu',                  ['axé']],
		['melbourne bounce',          ['future bounce']],
		['merengue',                  ['merecumbé']],
		['metal',                     ['funk metal','grindcore','industrial metal','metalcore']],
		['metalcore',                 ['deathcore','electronicore']],
		['neo-psychedelia',           ['space rock revival']],
		['nuevo flamenco',            ['flamenco jazz']],
		['nuevo tango',               ['electrotango']],
		['opera',                     ['opera-ballet']],
		['pagodão',                   ['arrochadeira']],
		['partido alto',              ['samba-reggae']],
		['polka',                     ['biguine']],
		['pop',                       ['bhangra','bitpop','canzone neomelodica','country pop','folk pop','pop rock','pop soul']],
		['pop punk',                  ['emo pop']],
		['post-hardcore',             ['crunkcore']],
		['progressive house',         ['big room house']],
		['proto-punk',                ['glam punk']],
		['punk rock',                 ['garage punk','psychobilly','ska punk']],
		['r&b',                       ['boogaloo']],
		['ragga',                     ['ragga hip-hop']],
		['reggae',                    ['axé','samba-reggae','seggae']],
		['rock',                      ['bard rock','blues rock','country rock','electronic rock','funk rock','industrial rock','pop rock','rap rock']],
		['rockabilly',                ['psychobilly']],
		['samba',                     ['samba-choro','samba-jazz']],
		['séga',                      ['seggae']],
		['sertanejo universitário',   ['arrocha sertanejo']],
		['shoegaze',                  ['blackgaze']],
		['ska',                       ['ska punk','spouge']],
		['soca',                      ['chutney soca','rapso']],
		['son cubano',                ['bolero son','boogaloo']],
		['soul',                      ['acid jazz','country soul','pop soul']],
		['space rock',                ['space rock revival']],
		['swing',                     ['electro swing']],
		['symphony',                  ['sinfonia concertante']],
		['tecnobrega',                ['brega funk','tecnofunk']],
		['thrash metal',              ['crossover thrash']],
		['trap',                      ['trap soul']],
		['vaudeville',                ['vaudeville blues']],
		['western classical',         ['third stream']],

	],
	// Secondary influence. For example one style being slightly influenced by another.
	style_secondary_origin: [

		// what is called 'influenced genres' in MusicBrainz

		['2 tone',                        ['third wave ska']],
		['2-step',                        ['dubstyle','future garage','grime']],
		['acid house',                    ['acid breaks','acid techno','acid trance','gabber','hard house','trance']],
		['acid rock',                     ['hard rock']],
		['acid techno',                   ['acidcore','birmingham sound','hard techno','peak time techno']],
		['acid trance',                   ['hard trance','psytrance']],
		['afro house',                    ['organic house']],
		['afro trap',                     ['gommance']],
		['afrobeat',                      ['maloya élektrik']],
		['afrobeats',                     ['afroswing']],
		['aggrotech',                     ['cyber metal']],
		['alternative dance',             ['grebo','yakousei']],
		['alternative r&b',               ['trap latino']],
		['alternative rock',              ['garage rock revival','mangue beat']],
		['amapiano',                      ['afropiano','cruise']],
		['ambient',                       ['ambient house','ambient noise wall','ambient pop','ambient techno','ambient trance','atmospheric drum and bass','dark folk','downtempo','dreampunk','dungeon synth','illbient','post-rock','progressive electronic','psybient','slushwave','weightless']],
		['ambient house',                 ['atmospheric drum and bass']],
		['american primitive guitar',     ['free folk']],
		['americana',                     ['ambient americana']],
		['anarcho-punk',                  ['d-beat']],
		['anatolian rock',                ['özgün müzik']],
		['arabesk',                       ['arabesk rap','özgün müzik']],
		['arena rock',                    ['pop metal']],
		['arrocha',                       ['batidão romântico']],
		['atmospheric drum and bass',     ['liquid funk']],
		['avant-garde',                   ['avant-folk','avant-garde jazz','avant-garde metal','avant-garde pop','avant-prog']],
		['avant-garde jazz',              ['experimental big band','post-bop']],
		['axé',                           ['pagode romântico','rasteirinha']],
		['bachata',                       ['bachatón','electro latino']],
		['baião',                         ['forró']],
		['bakersfield sound',             ['truck driving country']],
		['balearic beat',                 ['balearic trance']],
		['ballad opera',                  ['singspiel']],
		['baltimore club',                ['bérite club','jersey club','philly club']],
		['bambuco',                       ['trova yucateca']],
		['banda sinaloense',              ['movimiento alterado','nortec']],
		['baroque',                       ['neoclassical new age']],
		['baroque pop',                   ['chamber pop','soft rock']],
		['bass house',                    ['speed house']],
		['bassline',                      ['uk jackin']],
		['beat music',                    ['bolero-beat','freakbeat','mod','pop yeh-yeh','yé-yé']],
		['bebop',                         ['hard bop','sacred steel']],
		['bélé',                          ['zouk']],
		['belgian techno',                ['hyper techno']],
		['benga',                         ['sungura']],
		['bhangra',                       ['folkhop']],
		['big band',                      ['samba de gafieira','soul']],
		['big room house',                ['big room trance','jungle terror']],
		['biguine',                       ['tumbélé','zouk']],
		['bit music',                     ['digital fusion','purple sound']],
		['black metal',                   ['black ambient','black noise','blackened crust','blackened death metal','dungeon synth','neocrust','viking metal']],
		['bluegrass',                     ['trampská hudba']],
		['blues',                         ['americana','deep soul','dixieland','jazz','korean ballad','nuevo flamenco','occult rock','rock and roll','roots rock','southern metal','swamp pop','traditional black gospel','traditional country','vocal jazz','zydeco']],
		['blues rock',                    ['hard rock','heavy psych','metal','punk blues','southern rock','stoner metal','stoner rock','traditional doom metal']],
		['bolero',                        ['jazz guachaca','latin ballad','rhumba (US "ballroom rumba")','samba-joia','trova yucateca','vietnamese bolero']],
		['bongo flava',                   ['singeli']],
		['boogie',                        ['dance-rock']],
		['boogie-woogie',                 ['country boogie']],
		['bossa nova',                    ['mpb','onda nueva','sambass']],
		['bounce',                        ['lowend','twerk']],
		['bouncy techno',                 ['hard house','uk hardcore']],
		['brazilian bass',                ['mega funk','slap house']],
		['breakbeat',                     ['baltimore club','breakstep','jersey club','nerdcore techno','wonky techno']],
		['breakbeat hardcore',            ['deathchant hardcore','fidget house','florida breaks','hard house','uk hardcore','west coast breaks']],
		['british rhythm & blues',        ['freakbeat','mod']],
		['britpop',                       ['post-britpop']],
		['brostep',                       ['drumstep','glitch hop edm','hybrid trap','moombahcore']],
		['bubblegum bass',                ['hyperpop']],
		['bubblegum pop',                 ['bubblegum dance']],
		['cabaret',                       ['dark cabaret']],
		['cadence lypso',                 ['zouk']],
		['cajun',                         ['swamp blues','swamp rock','zydeco']],
		['calypso',                       ['brega calypso','palm-wine','shanto','ska','soca','tropical rock']],
		['carimbó',                       ['brega calypso','lambada']],
		['celtic',                        ['celtic electronica','celtic metal','celtic new age','celtic punk','celtic rock','james bay fiddling']],
		['chamarrita açoriana',           ['chamarrita rioplatense']],
		['champeta',                      ['tropicanibalismo']],
		['chanson française',             ['canzone d\u0027autore','kleinkunst','música de intervenção','neo kyma']],
		['chicago blues',                 ['british blues']],
		['chillwave',                     ['chillsynth','cloud rap','witch house']],
		['chinese classical',             ['burmese classical']],
		['chinese opera',                 ['hát tuồng']],
		['chinese revolutionary opera',   ['korean revolutionary opera']],
		['chiptune',                      ['kawaii future bass','nintendocore']],
		['chopped and screwed',           ['witch house']],
		['choro',                         ['valsa brasileira']],
		['church music',                  ['holy minimalism']],
		['ciranda',                       ['mangue beat']],
		['city pop',                      ['j-pop','pop kreatif']],
		['cloud rap',                     ['hexd','regalia','tread','wave']],
		['coco',                          ['mangue beat']],
		['comedy',                        ['comedy hip hop','comedy rock','scrumpy and western']],
		['compas',                        ['tumbélé','zouk']],
		['complextro',                    ['moombahcore']],
		['conga',                         ['pachanga']],
		['contemporary folk',             ['americana','heartland rock','jesus music','nyū myūjikku','progressive country','slowcore']],
		['contemporary r&b',              ['afroswing','funk melody','k-pop','minneapolis sound','neo soul','reggae-pop','trap latino']],
		['copla',                         ['flamenco pop']],
		['corrido',                       ['jazz guachaca']],
		['country',                       ['americana','cowpunk','roots rock','southern rock','trampská hudba','vude']],
		['country blues',                 ['skiffle']],
		['country gospel',                ['bluegrass gospel']],
		['country rock',                  ['heartland rock','rock rural','soft rock','truck driving country']],
		['crunk',                         ['ratchet music']],
		['crust punk',                    ['crack rock steady']],
		['cueca',                         ['chilena','jazz guachaca']],
		['cumbia',                        ['guaracha edm (Colombian electronic genre)','lambada','pachanga','porro','tecnomerengue','tropicanibalismo']],
		['cumbia mexicana',               ['cumbia norteña mexicana','tribal guarachero']],
		['cumbia peruana',                ['cumbia villera']],
		['cumbia villera',                ['rkt']],
		['cuplé',                         ['copla']],
		['dance',                         ['dance-pop']],
		['dance-pop',                     ['freestyle','funk melody','hyperpop','k-pop','manele','modern laiko','semi-trot','tallava']],
		['dance-punk',                    ['new rave','sasscore']],
		['dancehall',                     ['afroswing','bashment soca','bubbling','dembow','genge','merenhouse','raggacore','raggatek','reggaeton','uk funky']],
		['dangdut',                       ['qasidah modern']],
		['dansband',                      ['dansktop']],
		['danzón',                        ['chachachá','mambo','tamborera']],
		['dark ambient',                  ['dark jazz','death industrial','drone metal','martial industrial','minatory','psycore','winter synth']],
		['dark psytrance',                ['forest psytrance']],
		['dark wave',                     ['new beat','steampunk','witch house']],
		['darkstep',                      ['dungeon sound']],
		['death metal',                   ['death-doom metal','goregrind','stenchcore','war metal']],
		['death-doom metal',              ['funeral doom metal']],
		['deathstep',                     ['minatory','tearout brostep']],
		['deconstructed club',            ['epic collage']],
		['deep house',                    ['afro house','amapiano','brazilian bass','lo-fi house','melodic house','organic house','outsider house','progressive psytrance','tropical house']],
		['delta blues',                   ['sacred steel']],
		['detroit techno',                ['ghettotech','minimal techno']],
		['disco',                         ['burger-highlife','dance-pop','dance-punk','dark disco','freestyle','french house','garage house','hip hop','house','kwaito','manila sound','minneapolis sound','nu disco','old school hip hop','township bubblegum','urban cowboy','vude']],
		['dixieland',                     ['skiffle','western swing']],
		['doom metal',                    ['sludge metal','stoner metal','stoner rock']],
		['downtempo',                     ['barber beats','chillstep','lo-fi hip hop','organic house']],
		['dream pop',                     ['ambient pop','ethereal wave','shoegaze','witch house']],
		['dream trance',                  ['melodic trance']],
		['drill',                         ['chicago bop']],
		['drone',                         ['drone metal','free folk','space ambient','winter synth']],
		['drum and bass',                 ['artcore','breakcore','grime','hardcore breaks','nu skool breaks']],
		['dub',                           ['dub poetry','dub techno','dubwise','illbient','ragga jungle']],
		['dubstep',                       ['dubstyle','halftime','hardcore breaks','ori deck','riddim dubstep','trap edm']],
		['dungeon synth',                 ['dungeon rap']],
		['dutch house',                   ['jungle dutch','melbourne bounce','moombahton']],
		['easy listening',                ['mallsoft','sunshine pop','utopian virtual']],
		['ebm',                           ['belgian techno','cyber metal','dark disco','dark electro','electro-industrial','futurepop','makina','trance']],
		['edm',                           ['digicore','electropop','flex dance music','funk mandelão','hexd','jackin house','mahraganat','neue deutsche härte']],
		['electric blues',                ['british blues','sacred steel','southern soul']],
		['electro',                       ['florida breaks','freestyle','funk carioca','ghettotech','memphis rap','miami bass','techno bass','wonky techno']],
		['electro house',                 ['big room trance','future house','glitch hop edm','midtempo bass','tribal guarachero']],
		['electro-disco',                 ['synthwave']],
		['electro-industrial',            ['darksynth']],
		['electroacoustic',               ['eai']],
		['electroclash',                  ['french electro']],
		['electronic',                    ['ebm','electro-disco','electropunk','livetronica','new wave','novo dub','picopop','post-classical','power noise','tecnobrega']],
		['electropop',                    ['hyperpop','semi-trot']],
		['electropunk',                   ['neue deutsche welle']],
		['eleki',                         ['group sounds']],
		['emo',                           ['screamo']],
		['ethereal wave',                 ['witch house']],
		['euphoric hardstyle',            ['rawphoric']],
		['euro house',                    ['hardbag']],
		['euro-trance',                   ['euphoric hardstyle','hands up','lento violento']],
		['eurodance',                     ['dream trance','euro-trance','funkot','hands up','manyao','vinahouse']],
		['exotica',                       ['cocktail nation']],
		['experimental rock',             ['post-hardcore']],
		['fado',                          ['música de intervenção']],
		['festival progressive house',    ['heaven trap']],
		['fife and drum',                 ['fife and drum blues']],
		['flamenco',                      ['copla','flamenco pop','rock andaluz','saeta']],
		['folk',                          ['ballad opera','canzone d\u0027autore','ethio-jazz','folk metal','folk punk','folk rock','folktronica','gypsy jazz','gypsy punk','miejski folk','mulatós','pacific reggae','pagan black metal','post-minimalism','progressive bluegrass','rock andino','romantische oper','southern rock','traditional country','tribal ambient','tribal house','viking metal','viking rock','volkstümliche musik','zhongguo feng']],
		['folk pop',                      ['soft rock','stomp and holler']],
		['folk rock',                     ['jangle pop','jesus music','neo-acoustic','slowcore']],
		['footwork',                      ['drill','hardcore breaks']],
		['forró',                         ['lambada']],
		['free improvisation',            ['conducted improvisation','free folk','modern creative','onkyo']],
		['free jazz',                     ['conducted improvisation','free improvisation','modern creative']],
		['free tekno',                    ['modern hardtek']],
		['freestyle',                     ['funk melody']],
		['frenchcore',                    ['uptempo hardcore']],
		['full-on',                       ['hi-tech']],
		['funk',                          ['boogie','burger-highlife','chicago house','dance-punk','disco','forró universitário','french house','funky house','ghetto funk','hip hop','jazz-funk','madchester','maloya élektrik','manila sound','mobb music','new jack swing','qaraami','samba soul','songo','timba','ziglibithy']],
		['funk carioca',                  ['funknejo']],
		['funk metal',                    ['nu metal','rap metal']],
		['funk rock',                     ['mangue beat']],
		['funkot',                        ['breakbeat kota']],
		['funky house',                   ['jackin house']],
		['future bass',                   ['colour bass','dariacore','future riddim']],
		['future house',                  ['slap house']],
		['g-funk',                        ['purple sound']],
		['gabber',                        ['bouncy techno','deathchant hardcore','hardstyle','industrial hardcore','rawstyle','terrorcore','uptempo hardcore']],
		['gagok',                         ['oriental ballad']],
		['gamelan',                       ['campursari','gambang kromong','jaipongan','kliningan','kuda lumping']],
		['garage house',                  ['future house','speed garage','uk garage']],
		['garage rock',                   ['punk','punk rock','shitgaze']],
		['ghazal',                        ['adhunik geet','pop ghazal']],
		['ghetto house',                  ['baltimore club','footwork','ghettotech']],
		['glam rock',                     ['glam metal','new romantic','visual kei']],
		['glitch',                        ['glitch pop','microhouse','psycore','wonky techno']],
		['glitch hop',                    ['glitch hop edm']],
		['goa trance',                    ['psybient','psybreaks','psytrance']],
		['gospel',                        ['country gospel','deep soul','gospel house','hard bop','jersey sound','motown','soul','soul blues','soul jazz','southern soul']],
		['gothic metal',                  ['symphonic metal']],
		['gothic rock',                   ['deathrock','ethereal wave','gothic metal','visual kei']],
		['gqom',                          ['amapiano','bérite club','cruise']],
		['grime',                         ['bérite club','neo-grime','purple sound','trap edm','uk drill']],
		['grindcore',                     ['powerviolence']],
		['grunge',                        ['post-grunge','riot grrrl']],
		['guaguancó',                     ['rumba flamenca','tumbélé']],
		['guaracha',                      ['rumba flamenca']],
		['gwo ka',                        ['zouk']],
		['habanera',                      ['danzón','vanera']],
		['haitian vodou drumming',        ['rara']],
		['hands up',                      ['euphoric hardstyle']],
		['hard bop',                      ['post-bop']],
		['hard house',                    ['hard nrg','speed house']],
		['hard rock',                     ['black \u0027n\u0027 roll','death \u0027n\u0027 roll','heavy metal','heavy psych','medieval rock','occult rock','southern rock']],
		['hard trance',                   ['euro-trance','freeform hardcore','hardstyle','melodic trance']],
		['hardbag',                       ['hard house']],
		['hardcore punk',                 ['crack rock steady','post-hardcore','screamo','skacore','sludge metal','thrash metal']],
		['hardcore techno',               ['breakcore','hardstyle','hardvapour','lento violento','mashcore']],
		['hardstep',                      ['techstep']],
		['hardstyle',                     ['hard trap','hardwave','lento violento','philly club','powerstomp']],
		['heavy metal',                   ['black \u0027n\u0027 roll','burning spirits','death \u0027n\u0027 roll','epic doom metal','melodic death metal','neoclassical metal','power metal','stenchcore','traditional doom metal','visual kei']],
		['hi-nrg',                        ['eurobeat','hard house','hard nrg']],
		['highlife',                      ['hiplife','makossa']],
		['hindustani classical',          ['adhunik geet','minimalism','sarala gee','sufi rock','sufiana kalam']],
		['hip hop',                       ['beatboxing','bro-country','dembow','folkhop','footwork','freestyle','funk carioca','g-house','ghetto funk','grebo','grime','hip hop soul','hip house','illbient','k-pop','kapuka','kwaito','mahraganat','mambo urbano','mangue beat','merenhouse','neo soul','new jack swing','nu metal','rap metal','reggaeton','salsa choke','trip hop','uk street soul']],
		['honky tonk',                    ['neo-traditional country','truck driving country']],
		['horror synth',                  ['darksynth']],
		['house',                         ['bassline','budots','florida breaks','kuduro','manyao','merenhouse','nortec','salsa choke','synthwave']],
		['hyphy',                         ['jerk rap','ratchet music']],
		['hypnagogic pop',                ['utopian virtual']],
		['idm',                           ['flashcore','glitch pop','hardvapour','microhouse','nortec']],
		['idol kayō',                     ['j-pop']],
		['indian classical',              ['burmese classical','indo jazz','persian classical']],
		['indie folk',                    ['slowcore','stomp and holler']],
		['indie pop',                     ['indietronica','math pop','neo-acoustic','yakousei']],
		['indie rock',                    ['garage rock revival','indie folk','math pop','midwest emo','new rave','post-britpop','post-punk revival','shoegaze','yakousei']],
		['industrial',                    ['ebm','industrial hardcore','industrial hip hop','industrial techno','neue deutsche welle','power electronics','steampunk']],
		['industrial hardcore',           ['rawstyle','uptempo hardcore']],
		['industrial metal',              ['neue deutsche härte']],
		['instrumental hip hop',          ['barber beats']],
		['islamic modal music',           ['persian classical','sufiana kalam']],
		['italo dance',                   ['lento violento']],
		['italo-disco',                   ['chicago house','doskpop','eurobeat','funktronica','italo house','spacesynth','synthwave']],
		['j-core',                        ['future core']],
		['j-pop',                         ['denpa','kawaii metal']],
		['jácara',                        ['guaracha (Cuban)']],
		['jaipongan',                     ['kuda lumping']],
		['jam band',                      ['jamgrass']],
		['jangle pop',                    ['c86','madchester','neo-acoustic','paisley underground']],
		['javanese gamelan',              ['langgam jawa']],
		['jazz',                          ['bossa nova','compas','digital fusion','electric texas blues','funk','hapa haole','humppa','jazz guachaca','jazz poetry','jazz pop','jazz rap','jazz rock','jazzstep','kwela','lounge','makossa','mod','mood kayō','muziki wa dansi','new orleans blues','nu jazz','nuevo flamenco','nuevo tango','onda nueva','pluggnb','post-minimalism','post-rock','progressive bluegrass','progressive rock','qaraami','rhumba (US "ballroom rumba")','sambalanço','shidaiqu','skiffle','songo','sophisti-pop','texas blues','zeuhl','zydeco']],
		['jazz fusion',                   ['canterbury scene','smooth jazz']],
		['jazz rock',                     ['canterbury scene']],
		['jazzstep',                      ['liquid funk']],
		['jerk rap',                      ['ratchet music']],
		['jersey club',                   ['dariacore','jersey drill','jungle dutch']],
		['jesus music',                   ['contemporary christian']],
		['joropo',                        ['onda nueva']],
		['juke',                          ['footwork']],
		['jump blues',                    ['ska','soul blues']],
		['jump up',                       ['drumstep']],
		['jungle',                        ['breakcore','grime','nerdcore techno','speed garage']],
		['jungle terror',                 ['jungle dutch']],
		['k-pop',                         ['semi-trot']],
		['kadongo kamu',                  ['kidandali']],
		['kawaii future bass',            ['future core']],
		['kayōkyoku',                     ['nyū myūjikku']],
		['kidumbak',                      ['taarab']],
		['kilapanga',                     ['kuduro']],
		['kizomba',                       ['batidão romântico']],
		['klezmer',                       ['gypsy punk','orthodox pop']],
		['koplo',                         ['funkot']],
		['krautrock',                     ['berlin school','industrial']],
		['kuduro',                        ['bérite club','dennery segment']],
		['kundiman',                      ['manila sound']],
		['kwaito',                        ['afro house','amapiano','gqom','township jive']],
		['kwela',                         ['mbaqanga']],
		['lambada',                       ['brega calypso','tecnomerengue']],
		['latin',                         ['latin disco','latin funk','latin jazz','latin pop','latin rock','latin soul']],
		['latin pop',                     ['cumbia pop']],
		['lounge',                        ['cocktail nation']],
		['luk thung',                     ['mor lam sing','phleng phuea chiwit']],
		['lundu',                         ['maxixe','samba de gafieira']],
		['makossa',                       ['ziglibithy']],
		['malouf',                        ['staïfi']],
		['mambo',                         ['compas','mambo chileno','salsa']],
		['mambo urbano',                  ['mambo chileno']],
		['mandopop',                      ['manyao']],
		['marabi',                        ['kwela']],
		['maracatu',                      ['mangue beat']],
		['march',                         ['dobrado','ragtime']],
		['marching band',                 ['tanjidor']],
		['marchinha',                     ['frevo']],
		['math rock',                     ['mathcore']],
		['maxixe',                        ['frevo','samba de gafieira','tango']],
		['mbaqanga',                      ['township bubblegum','township jive']],
		['mbube',                         ['isicathamiya']],
		['mchiriku',                      ['singeli']],
		['medieval',                      ['bardcore']],
		['meiji shinkyoku',               ['shinkyoku']],
		['melodic death metal',           ['melodic metalcore']],
		['melodic dubstep',               ['colour bass','future riddim','heaven trap']],
		['melodic techno',                ['future rave','melodic house']],
		['melodic trance',                ['euphoric hardstyle','festival progressive house','nitzhonot']],
		['memphis rap',                   ['drift phonk','phonk']],
		['mento',                         ['reggae','ska']],
		['merengue',                      ['electro latino','pachanga','samba-reggae']],
		['méringue',                      ['compas']],
		['metal',                         ['d-beat','darksynth','deathstep']],
		['miami bass',                    ['baltimore club','florida breaks','funk carioca','ghettotech','tamborzão','twerk']],
		['microhouse',                    ['rominimal']],
		['midwest emo',                   ['math pop']],
		['milonga',                       ['tango']],
		['minimal techno',                ['melbourne bounce','melodic techno','microhouse','progressive psytrance','rominimal']],
		['minimalism',                    ['post-minimalism','totalism']],
		['minstrelsy',                    ['coon song']],
		['modal jazz',                    ['post-bop']],
		['modern classical',              ['cinematic classical','free improvisation','modern creative','zeuhl']],
		['moombahton',                    ['ori deck']],
		['mor lam',                       ['phleng phuea chiwit']],
		['morna',                         ['coladeira']],
		['motown',                        ['smooth soul']],
		['mpb',                           ['rock rural','tropicália']],
		['mugham',                        ['jazz mugham']],
		['music hall',                    ['chap hop']],
		['musical',                       ['rock opera']],
		['musique concrète',              ['industrial']],
		['muziki wa dansi',               ['bongo flava']],
		['nasheed',                       ['orkes gambus']],
		['neo-medieval folk',             ['medieval metal','medieval rock']],
		['neo-psychedelia',               ['hypnagogic pop','shoegaze']],
		['neo-rockabilly',                ['punk','rockabilly']],
		['neo-traditional country',       ['texas country']],
		['neoclassical dark wave',        ['martial industrial']],
		['neofolk',                       ['martial industrial']],
		['neofolklore',                   ['nueva canción chilena']],
		['nerdcore',                      ['chap hop']],
		['neue deutsche welle',           ['hamburger schule']],
		['neurofunk',                     ['halftime','neurohop']],
		['new age',                       ['comfy synth','hypnagogic pop','utopian virtual']],
		['new beat',                      ['belgian techno','dark disco','gabber','makina']],
		['new jack swing',                ['hip hop soul']],
		['new orleans blues',             ['swamp rock']],
		['new orleans r&b',               ['ska','swamp pop']],
		['new wave',                      ['dark wave','geek rock','neo-acoustic','paisley underground','post-punk revival','sasscore','steampunk','zolo']],
		['ngoma',                         ['mchiriku']],
		['nightcore',                     ['dariacore']],
		['nigun',                         ['orthodox pop']],
		['noise',                         ['death industrial','drone metal','gorenoise','industrial','musique concrète','noisecore','power noise','splittercore']],
		['noise rock',                    ['math rock','riot grrrl','shitgaze','shoegaze']],
		['norteño',                       ['nortec','tejano']],
		['nova cançó',                    ['nueva canción española']],
		['nu disco',                      ['yakousei']],
		['nu skool breaks',               ['breakstep']],
		['nueva canción',                 ['nueva trova']],
		['nwobhm',                        ['speed metal','thrash metal']],
		['oi',                            ['street punk','uk82','viking rock']],
		['opera',                         ['modinha','operatic pop']],
		['opéra comique',                 ['romantische oper','singspiel']],
		['operetta',                      ['kalon\u0027ny fahiny']],
		['outlaw country',                ['red dirt','texas country']],
		['p-funk',                        ['g-funk']],
		['pagode',                        ['pagodão']],
		['pasodoble',                     ['chotis madrileño']],
		['peak time techno',              ['future rave']],
		['persian classical',             ['sufiana kalam']],
		['philly soul',                   ['disco']],
		['plugg',                         ['regalia']],
		['polka',                         ['polca criolla','tejano']],
		['pop',                           ['blue-eyed soul','bubblegum bass','glitch pop','hamburger schule','idol kayō','indie rock','koplo','modern laiko','nashville sound','pagode romântico','pop metal','pop punk','pop raï','pop rap','qaraami','qasidah modern','reggae-pop','rhumba (US "ballroom rumba")','rumba catalana','salsa romántica','sertanejo romântico','sertanejo universitário','swamp rock','urban cowboy','vocal trance','zohioliin duu']],
		['pop rap',                       ['funk ostentação']],
		['pop rock',                      ['freakbeat','geek rock','glam rock','heartland rock','idol kayō','neo-traditional country','new wave','semi-trot','vocal surf']],
		['pop soul',                      ['philly soul']],
		['post-hardcore',                 ['math rock','midwest emo','riot grrrl','sasscore']],
		['post-industrial',               ['deconstructed club','midtempo bass','neofolk']],
		['post-metal',                    ['neocrust']],
		['post-punk',                     ['c86','dance-rock','garage rock revival','gothic rock','könsrock','neo-acoustic','neue deutsche welle','space rock revival','zolo']],
		['post-punk revival',             ['yakousei']],
		['post-rock',                     ['post-metal']],
		['power electronics',             ['death industrial']],
		['power metal',                   ['symphonic metal']],
		['power noise',                   ['industrial hardcore']],
		['power pop',                     ['geek rock','jangle pop','paisley underground']],
		['powerviolence',                 ['emoviolence']],
		['progressive electronic',        ['dreampunk','space ambient','synth-pop','synthwave']],
		['progressive house',             ['dream trance','melodic house','organic house','progressive breaks','progressive psytrance','progressive trance','west coast breaks']],
		['progressive rock',              ['occult rock','progressive electronic','progressive metal','rock andino','rock urbano','technical thrash metal','zeuhl','zolo']],
		['progressive trance',            ['melodic trance']],
		['proto-punk',                    ['punk']],
		['psychedelic',                   ['burmese stereo','freakbeat','jesus music','maloya élektrik','psychedelic folk','psychedelic pop','psychedelic rock','sampledelia','sunshine pop']],
		['psychedelic pop',               ['paisley underground','tropicália']],
		['psychedelic rock',              ['cumbia peruana','krautrock','occult rock','paisley underground','psychedelic soul','rock andino','stoner metal','stoner rock','traditional doom metal','tropicália']],
		['psytrance',                     ['psybient','psybreaks','psystyle']],
		['punk',                          ['brutal prog','miejski folk','nwobhm','punk rap']],
		['punk rock',                     ['grebo','hamburger schule','mod revival','neue deutsche welle','new wave','no wave','post-punk','punk blues','swing revival','third wave ska']],
		['punto',                         ['guajira']],
		['r&b',                           ['boogie','bro-country','funk','hard bop','mod','pluggnb','reggae','rock and roll','roots rock','sophisti-pop','soul','soul jazz','southern soul','timba','yacht rock','zydeco']],
		['ragga',                         ['kidandali','ragga jungle','raggacore','raggatek']],
		['ragga jungle',                  ['raggacore']],
		['ragtime',                       ['dixieland','jazz','piano blues','stride','tin pan alley']],
		['rap rock',                      ['rap metal']],
		['rawstyle',                      ['uptempo hardcore']],
		['reggae',                        ['dub poetry','dubwise','hip hop','kaneka','kapuka','koplo','raggatek','tropical rock','uk street soul']],
		['reggae-pop',                    ['reggae rock']],
		['reggaeton',                     ['cumbia turra','gengetone','gommance','mambo chileno','mambo urbano','moombahton','rasteirinha','salsa choke','trap latino']],
		['regional mexicano',             ['yu-mex']],
		['riddim dubstep',                ['briddim']],
		['ring shout',                    ['spirituals']],
		['rock',                          ['british rhythm & blues','forró universitário','koplo','nuevo flamenco','outlaw country','progressive bluegrass','progressive country','rasin','rock musical','samba-rock','third wave ska','vude']],
		['rock and roll',                 ['beat music','cumbia mexicana','glam rock','punk rock','rautalanka','southern rock','surf rock','swamp pop','tropical rock','yé-yé']],
		['rockabilly',                    ['cowpunk','swing revival']],
		['rocksteady',                    ['reggae']],
		['romantic classical',            ['cinematic classical','lied']],
		['roots reggae',                  ['reggae rock']],
		['rumba catalana',                ['rumba flamenca']],
		['rumba cubana',                  ['makossa','pachanga','rhumba (US "ballroom rumba")','rumba catalana','songo']],
		['rumba flamenca',                ['flamenco pop','rumba catalana','tecnorumba']],
		['russian romance',               ['avtorskaya pesnya']],
		['ryūkōka',                       ['enka','kayōkyoku']],
		['salsa',                         ['samba-reggae','tropicanibalismo']],
		['samba',                         ['rasteirinha','sambass']],
		['samba-canção',                  ['mpb']],
		['samba-choro',                   ['samba de breque']],
		['samba-exaltação',               ['sambalanço']],
		['samba-reggae',                  ['pagodão']],
		['samba-rock',                    ['pagode romântico','tropicália']],
		['schlager',                      ['dansband','dansktop','levenslied','rautalanka']],
		['schottische',                   ['chamamé','chotis madrileño','xote']],
		['screamo',                       ['neocrust']],
		['séga',                          ['maloya','santé engagé']],
		['semba',                         ['kizomba','kuduro']],
		['serialism',                     ['sonorism']],
		['sertanejo',                     ['pagode romântico','rock rural']],
		['shaabi',                        ['trap shaabi']],
		['shibuya-kei',                   ['akishibu-kei']],
		['shidaiqu',                      ['mandopop']],
		['shoegaze',                      ['shitgaze','witch house']],
		['sigidrigi',                     ['vude']],
		['singer-songwriter',             ['heartland rock']],
		['ska',                           ['brega calypso','reggae','rocksteady','swing revival']],
		['slap house',                    ['mega funk']],
		['slowcore',                      ['post-rock']],
		['sludge metal',                  ['neocrust','southern metal']],
		['smooth jazz',                   ['mallsoft','utopian virtual']],
		['snap',                          ['ratchet music']],
		['soca',                          ['uk funky','zess']],
		['soft rock',                     ['manila sound']],
		['son cubano',                    ['charanga','congolese rumba','rhumba (US "ballroom rumba")','rumba flamenca','salsa','songo','timba']],
		['soukous',                       ['afro-zouk','kidandali','makossa','muziki wa dansi','sungura','tumbélé','ziglibithy']],
		['soul',                          ['chipmunk soul','funk','ghetto funk','korean ballad','qaraami','reggae-pop','rocksteady','samba soul','sophisti-pop','soul blues','soul jazz','uk street soul']],
		['sound collage',                 ['epic collage']],
		['southern hip hop',              ['cloud rap','witch house']],
		['southern rock',                 ['red dirt']],
		['space disco',                   ['spacesynth']],
		['space rock',                    ['space disco']],
		['spacesynth',                    ['doskpop']],
		['speed garage',                  ['deep tech']],
		['speed metal',                   ['power metal','thrash metal']],
		['speedcore',                     ['flashcore']],
		['spirituals',                    ['blues','gospel','gospel house','traditional black gospel']],
		['stochastic music',              ['sonorism']],
		['stoner metal',                  ['southern metal']],
		['street punk',                   ['uk82']],
		['surf rock',                     ['indie surf','punk rock','rautalanka','surf punk','wong shadow']],
		['swing',                         ['dansband','mbaqanga','texas blues','western swing']],
		['swing revival',                 ['cocktail nation']],
		['symphonic prog',                ['neo-progressive rock','rock andaluz']],
		['synth funk',                    ['funktronica','purple sound','skweee']],
		['synth-pop',                     ['chicago house','dark wave','denpa','electropop','futurepop','hypnagogic pop','minimal synth','neue deutsche welle','new romantic','pon-chak disco','spacesynth','steampunk','synthwave','techno kayō','township bubblegum','utopian virtual']],
		['synthwave',                     ['chillsynth']],
		['taarab',                        ['bongo flava','kidumbak','singeli']],
		['talempong',                     ['talempong goyang']],
		['tamborito',                     ['tamborera']],
		['tango',                         ['jazz guachaca','maxixe']],
		['tearout',                       ['brostep']],
		['tech house',                    ['brazilian bass','future rave','hardgroove techno','melbourne bounce','midtempo bass','progressive psytrance']],
		['tech trance',                   ['big room trance']],
		['techno',                        ['belgian techno','changa tuki','hardcore techno','hardvapour','kuduro','nerdcore techno','nu skool breaks','skweee','tech house','tech trance','trance','tribal guarachero','west coast breaks']],
		['techstep',                      ['breakstep','neurofunk']],
		['tejano',                        ['tex-mex']],
		['tembang cianjuran',             ['kacapi suling']],
		['thrash metal',                  ['groove metal','stenchcore']],
		['thrashcore',                    ['grindcore']],
		['township jive',                 ['sungura','township bubblegum']],
		['traditional country',           ['country yodeling','rock and roll']],
		['traditional pop',               ['hapa haole']],
		['trance',                        ['florida breaks','funkot','hard nrg','hardwave','manyao','melodic techno','peak time techno','progressive house','trance metal','trancestep','uk hardcore','west coast breaks']],
		['trap',                          ['digicore','hexd','mambo chileno','phonk','trap edm','vaportrap','wave']],
		['trap edm',                      ['bérite club','future bass','hardwave','philly club']],
		['tribal house',                  ['changa tuki','hard drum','jungle terror','uk funky']],
		['trip hop',                      ['barber beats']],
		['trot',                          ['korean ballad']],
		['twee pop',                      ['donosti sound']],
		['uk funky',                      ['hard drum']],
		['uk garage',                     ['deep tech','future house','nu skool breaks','uk funky']],
		['uk hardcore',                   ['modern hardtek','powerstomp']],
		['v-pop',                         ['vinahouse']],
		['vallenato',                     ['tropicanibalismo','tropipop']],
		['vaporwave',                     ['future funk','hexd']],
		['vaudeville',                    ['tin pan alley']],
		['vocal jazz',                    ['filin','idol kayō','traditional pop']],
		['waltz',                         ['pasillo','tejano','vals criollo']],
		['western classical',             ['artcore','baroque pop','classical crossover','marching band','neoclassical dark wave','neoclassical metal','neoclassical new age','nhạc đỏ','nuevo tango','operatic pop','progressive electronic','progressive rock','ryūkōka','shinkyoku','symphonic black metal','symphonic metal','symphonic prog','symphonic rock']],
		['witch house',                   ['cloud rap']],
		['wonky',                         ['future bass','halftime','trap edm']],
		['zamacueca',                     ['cueca','marinera','zamba']],
		['znamenny chant',                ['kyivan chant']],
		['zouglou',                       ['coupé-décalé']],
		['zouk',                          ['kizomba']],
		['zydeco',                        ['swamp blues','swamp rock']],

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