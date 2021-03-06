/*
    MarkLogic User Conference App

    Copyright 2011 MarkLogic

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

Ext.ns("mluc", "mluc.widgets", "mluc.views");

Ext.define("mluc.RawJsonWriter", {
    extend: "Ext.data.Writer",
    alias: "writer.rawjson",
    writeRecords: function(request, data) {
        var i;
        for(i = 0; i < data.length; i += 1) {
            var record = data[i];
            if(this.ignoreKeys) {
                var j;
                for(j = 0; j < this.ignoreKeys.length; j += 1) {
                    delete record[this.ignoreKeys[j]];
                }
            }
        }

        if(data.length === 1) {
            request.jsonData = data[0];
        }
        else {
            request.jsonData = data;
        }
        return request;
    }
});

Ext.regModel("Speaker", {
    fields: [
        {name: "id", type: "string"},
        {name: "name", type: "string"},
        {name: "email", type: "string"},
        {name: "position", type: "string"},
        {name: "affiliation", type: "string"},
        {name: "bio", type: "string"},

        {name: "lastName", convert: function(value, record) {
            var name = record.get("name");
            var bits = name.split(" ");
            var last = bits[bits.length - 1];
            if(last === "PhD") {
                last = bits[bits.length - 2];
            }
            return last;
        }}
    ]
});

Ext.regModel("Session", {
    fields: [
        {name: "id", type: "string"},
        {name: "title", type: "string"},
        {name: "plenary", type: "boolean"},
        {name: "featured", type: "boolean", defaultValue: false},
        {name: "giveSurvey", type: "boolean"},
        {name: "speakerIds"},
        {name: "startTime", type: "date", dateFormat: "c"},
        {name: "endTime", type: "date", dateFormat: "c"},
        {name: "sessionDate", convert: function(value, record) { return record.get("startTime");}},
        {name: "roomNumber", convert: function(value, record) {
            var room = record.get("location");
            if(room === "Grand Ballroom") {
                return 1;
            }
            if(room === "Sea Cliff") {
                return 2;
            }
            if(room === "Pacific Heights") {
                return 3;
            }
            if(room === "Twin Peaks South") {
                return 4;
            }
            if(room === "Presidio") {
                return 5;
            }
            return 0;
        }},
        {name: "location", type: "string"},
        {name: "track", type: "string"},
        {name: "type", type: "string"},
        {name: "sponsor", type: "string"},
        {name: "abstract", type: "string"}
    ]
});

Ext.regModel("Attendee", {
    fields: [
        {name: "id", type: "string"},
        {name: "sessionId", type: "string"},
        {name: "username", type: "string"},
        {name: "realname", type: "string"},
        {name: "reason", type: "string"},
        {name: "dateAdded", type: "date", dateFormat: "c"},
        // Pull in the session info
        {name: "title", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("title") : undefined; }},
        {name: "speakerIds", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("speakerIds") : undefined; }},
        {name: "startTime", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("startTime") : undefined; }},
        {name: "endTime", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("endTime") : undefined; }},
        {name: "location", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("location") : undefined; }},
        {name: "track", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("track") : undefined; }},
        {name: "type", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("type") : undefined; }},
        {name: "sponsor", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("sponsor") : undefined; }},
        {name: "abstract", convert: function(value, record) { var sesh = Ext.getStore("SessionStore").getById(record.get("sessionId")); return sesh ? sesh.get("abstract") : undefined; }}
    ],
    proxy: {
        type: "rest",
        url: "/data/jsonstore.xqy",
        appendId: false,
        buildUrl: function(request) {
            var records = request.operation.records || [];
            var record = records[0];
            var username = mluc.readCookie("MLUC-USERNAME");

            if(record) {
                request.params = {uri: "/attendee/" + username + "/" + record.get("sessionId") + ".json"};
            }

            return Ext.data.RestProxy.superclass.buildUrl.apply(this, arguments);
        },
        writer: {
            type: "rawjson",
            ignoreKeys: ["title", "speakerIds", "startTime", "endTime", "location", "track", "type", "sponsor", "abstract"]
        }
    }
});

Ext.regModel("Survey", {
    fields: [
        {name: "id", type: "number"},
        {name: "forSession", type: "string"},
        {name: "userId", type: "string"},
        {name: "speakerQuality", type: "number"},
        {name: "sessionQuality", type: "number"},
        {name: "sessionComments", type: "string"},
        {name: "dateAdded", type: "date", dateFormat: "c"}
    ],
    proxy: {
        type: "rest",
        url: "/data/jsonstore.xqy",
        appendId: false,
        buildUrl: function(request) {
            var records = request.operation.records || [];
            var record = records[0];
            var username = mluc.readCookie("MLUC-USERNAME");

            if(record) {
                request.params = {uri: "/survey/" + username + "/" + record.get("forSession") + ".json"};
            }

            return Ext.data.RestProxy.superclass.buildUrl.apply(this, arguments);
        },
        writer: {
            type: "rawjson"
        }
    }
});

Ext.regModel("Sponsor", {
    fields: [
        {name: "id", type: "number"},
        {name: "company", type: "string"},
        {name: "tagline", type: "string"},
        {name: "level", type: "string"},
        {name: "imageURL", type: "string"},
        {name: "websiteFull", type: "string"},
        {name: "websitePretty", type: "string"},
        {name: "email", type: "string"},
        {name: "phone", type: "string"}
    ]
});


Ext.regStore("SpeakerStore", {
    model: "Speaker",
    proxy: {
        type: "ajax",
        url: "/data/jsonquery.xqy",
        extraParams:{q: '{key:"name"}'},
        reader: {
            type: "json",
            root: "results",
            totalProperty: "count"
        }
    },
    sorters: [
        {
            property : "lastName",
            direction: "ASC"
        }
    ],
    getGroupString: function(record) {
        var name = record.get("name");
        var bits = name.split(" ");
        var last = bits[bits.length - 1];
        return last[0];
    }
});

Ext.regStore("SessionStore", {
    model: "Session",
    proxy: {
        type: "ajax",
        url: "/data/jsonquery.xqy",
        extraParams:{q: '{key:"title"}'},
        reader: {
            type: "json",
            root: "results",
            totalProperty: "count"
        }
    },
    sorters: [
        {
            property : "startTime",
            direction: "ASC"
        },
        {
            property : "roomNumber",
            direction: "ASC"
        }
    ],
    getGroupString: function(record) {
        return record.get("startTime").format("g:ia") + " &ndash; " + record.get("endTime").format("g:ia");
    }
});

Ext.regStore("SessionSearchStore", {
    model: "Session",
    proxy: {
        type: "ajax",
        url: "/data/jsonquery.xqy",
        extraParams:{q: '{key:"title"}'},
        reader: {
            type: "json",
            root: "results",
            totalProperty: "count"
        }
    },
    sorters: [
        {
            property : "startTime",
            direction: "ASC"
        },
        {
            property : "roomNumber",
            direction: "ASC"
        }
    ]
});

Ext.regStore("SpeakerSearchStore", {
    model: "Speaker",
    proxy: {
        type: "ajax",
        url: "/data/jsonquery.xqy",
        extraParams:{q: '{key:"name"}'},
        reader: {
            type: "json",
            root: "results",
            totalProperty: "count"
        }
    },
    sorters: [
        {
            property : "lastName",
            direction: "ASC"
        }
    ]
});

Ext.regStore("MySessionsStore", {
    model: "Attendee",
    proxy: {
        type: "ajax",
        url: "/data/jsonquery.xqy",
        extraParams:{q: '{key:"sessionId"}'},
        reader: {
            type: "json",
            root: "results",
            totalProperty: "count"
        }
    },
    sorters: [
        {
            sorterFn: function(mySession1, mySession2) {
                var sessionStore = Ext.getStore("SessionStore");
                var session1 = sessionStore.getById(mySession1.get("sessionId"));
                var session2 = sessionStore.getById(mySession2.get("sessionId"));

                return session1 > session2 ? 1 : (session1 < session2 ? -1 : 0);
            }
        }
    ],
    getGroupString: function(record) {
        var sessionStore = Ext.getStore("SessionStore");
        var session = sessionStore.getById(record.get("sessionId"));

        return session.get("startTime").format("g:ia") + " &ndash; " + session.get("endTime").format("g:ia");
    }
});

Ext.regStore("SponsorsStore", {
    model: "Sponsor",
    getGroupString: function(record) {
        return record.get("level");
    },
    sorters: [
        {
            property : "id",
            direction: "ASC"
        }
    ],
    data: [
        {
            id: "1",
            company: "Avalon Consulting, LLC",
            level: "Platinum",
            info: "Avalon Consulting, LLC is a team of expert-level consultants providing thought leadership and technical integrations for enterprise-scale internet, intranet, and extranet sites. Avalon enhances leading technical platforms such as MarkLogic to create first-rate enterprise web experiences.<br>Since partnering with MarkLogic Corporation in 2009, Avalon has delivered solutions to more than a dozen MarkLogic customers. Drawing on critical expertise in search and content management, Avalon has established itself as the recognized leader for creating compelling business solutions on the MarkLogic platform.<br> Avalon is headquartered in Plano, TX with a regional office in Washington, DC.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/avalon.png",
            websiteFull: "http://www.avalonconsult.com/",
            websitePretty: "avalonconsult.com"
        },
        {
            id: "2",
            company: "Innodata Isogen",
            level: "Gold",
            info: "A leader in the practical application of content and publishing technologies, Innodata Isogen provides consulting, technology, editorial and production services to information- intensive enterprises worldwide, helping them operate more competitively and profitably. Widely recognized for our experience and expertise in transformative content technologies, process re-engineering and XML publishing, we’ve partnered successfully with MarkLogic since 2004 to help clients reduce the cost of creating, managing and delivering content.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/innodata.png",
            websiteFull: "http://www.innodata-isogen.com/",
            websitePretty: "innodata-isogen.com"
        },
        {
            id: "3",
            company: "Cognizant",
            level: "Gold",
            info: "Cognizant (Nasdaq: CTSH) is a leading provider of information technology, consulting, and business process outsourcing services. With more than 50 delivery centers worldwide and over 100,000 employees, Cognizant combines a passion for client satisfaction, technology innovation, deep industry and business process expertise, and a global, collaborative workforce that embodies the future of work. Cognizant is a member of the NASDAQ-100, the S&P 500, the Forbes Global 2000, and the Fortune 1000. Follow us on Twitter: Cognizant.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/CG_logoReflect.jpg",
            websiteFull: "http://www.cognizant.com/",
            websitePretty: "cognizant.com"
        },
        {
            id: "4",
            company: "Infosys Technologies",
            level: "Gold",
            info: "Infosys Technologies Ltd. (NASDAQ: INFY) defines, designs and delivers technology-enabled business solutions for Global 2000 companies. Infosys also provides a complete range of services by leveraging our domain and business expertise and strategic alliances with leading technology providers. Our offerings span business and technology consulting, application services, systems integration, product engineering, custom software development, maintenance, re-engineering, independent testing and validation services, IT infrastructure services and business process outsourcing.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/infosys.jpg",
            websiteFull: "http://www.infosys.com/",
            websitePretty: "infosys.com"
        },
        {
            id: "5",
            company: "Virtusa",
            level: "Gold",
            info: "Virtusa provides a broad range of IT services through an optimized global delivery model. We specialize in developing online products for information and media companies. Virtusa is a strategic implementation and integration partner for MarkLogic and has built a solution accelerator for content spot-lighting on top of MarkLogic. Other practice areas include ECM, moblity, BPM, DW/BI, and custom application/product development. Marquee clients include Thomson Reuters, National Geographic, JPMC, Aetna, Citibank and many others.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/virtusa.jpg",
            websiteFull: "http://www.virtusa.com/",
            websitePretty: "virtusa.com"
        },
        {
            id: "6",
            company: "Janya",
            level: "Silver",
            info: "Janya provides semantic analysis tools and solutions that extract critical information from unstructured data to create actionable intelligence. Organizations use Janya’s content enrichment capabilities to accelerate sharing and discovery of hidden knowledge within their existing information stores. Customizable solutions include automated metadata, fact and relationship extraction, and social media mining.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/janyaLeft.jpg",
            websiteFull: "http://www.janya.com/",
            websitePretty: "janya.com"
        },
        {
            id: "7",
            company: "Antenna House",
            level: "Silver",
            info: "Antenna House is very pleased to be showing Formatter V5.2 with support for specifying page layouts for PDF and print using either CSS or XSL-FO. Now users can select the stylesheet strategy that best suits their web, content management and business needs. Visit Antenna House to see why Formatter is used worldwide for demanding formatting requirements. ",
            imageURL: "http://www.marklogicevents.com/img/sponsors/antennaHouse.jpg",
            websiteFull: "http://www.antennahouse.com/",
            websitePretty: "antennahouse.com"
        },
        {
            id: "8",
            company: "iFactory",
            level: "Silver",
            info: "Since 1992 iFactory has delivered innovative, inspiring, and intelligent interactive solutions to more than 150 organizations in a variety of verticals such as publishing, higher education and health care. iFactory's epublishing platform, PubFactory, is a highly regarded solution for publishers including Oxford University Press, DeGruyter, SAGE, and Cengage. ",
            imageURL: "http://www.marklogicevents.com/img/sponsors/iFactoryLogo.jpg",
            websiteFull: "http://www.ifactory.com/",
            websitePretty: "ifactory.com"
        },
        {
            id: "9",
            company: "TEMIS",
            level: "Silver",
            info: "TEMIS is the leading provider of Semantic Content Enrichment solutions. TEMIS helps publishers to add value to their content by extracting entities and intelligence from text, to create metadata programmatically and to allow semantic navigation. Documents are linked based on their actual content, and automatic classification enables publishers to repurpose their content and create new custom products.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/temisLeft.jpg",
            websiteFull: "http://www.temis.com/",
            websitePretty: "temis.com"
        },
        {
            id: "10",
            company: "Data Conversion Laboratory",
            level: "Silver",
            info: "Data Conversion Laboratory, Inc. specializes in converting and organizing content for web publishing, database population, and the creation of electronic documents. DCL converts from any source format to XML including NLM, DOCBOOK, DITA, TEI and S1000D as well as XHTML E-book formats. DCL has processed more than one billion pages for publishers, industry, government, libraries, and documentation developers.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/dclLogoLeft.jpg",
            websiteFull: "http://www.dclab.com/",
            websitePretty: "dclab.com"
        },
        {
            id: "11",
            company: "HTC Global Services",
            level: "Silver",
            info: "HTC Global Services (HTC) is a leading global Information Technology solutions and services provider specialized in content management, delivery and publishing solutions for Digital Media. HTC’s Mobile Publishing Framework integrates seamlessly with publishing systems for delivery of digital content on wide variety of platforms including Tablets, iPad, and Smart Phones.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/htcLeft.jpg",
            websiteFull: "http://www.htcinc.com/",
            websitePretty: "htcinc.com"
        },
        {
            id: "12",
            company: "Applied Relevance",
            level: "Silver",
            info: "Applied Relevance produces software and services to help enterprise users find the information they need. AR•Semantics for MarkLogic Server provides high-performance auto-classification of enterprise documents, a taxonomy management console and metadata enhancement. Create dynamic rules to categorize documents in an intuitive, attractive user interface.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/applied.jpg",
            websiteFull: "http://appliedrelevance.com/",
            websitePretty: "appliedrelevance.com"
        },
        {
            id: "13",
            company: "Typefi",
            level: "Silver",
            info: "eXtyles & Typefi combined is an editorial and composition solution that enables users to generate XML from Word and dynamically flow it into InDesign Server to create richly formatted documents for print and eBook without users having InDesign on the desktop. The solution significantly reduces editorial and composition time.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/typefiLeft.jpg",
            websiteFull: "http://www.typefi.com/",
            websitePretty: "typefi.com"
        },
        {
            id: "14",
            company: "Really Strategies",
            level: "Bronze",
            info: "RSuite is an XML-optimized content management system powered by MarkLogic Server and used by the world’s leading publishers. RSuite accelerates publishers’ revenue and profit growth through better content management, including a robust workflow engine and suite of editorial/production capabilities. Already a MarkLogic customer? Contact us to leverage your investment today!",
            imageURL: "http://www.marklogicevents.com/img/sponsors/rsuite.gif",
            websiteFull: "http://www.reallysi.com/",
            websitePretty: "reallysi.com"
        },
        {
            id: "15",
            company: "Flatirons Solutions",
            level: "Additional Sponsors",
            info: "Flatirons Solutions is a Colorado based system integrator and long-time MarkLogic partner specializing in XML publishing, dynamic content delivery, and digital asset management. Their implementations focus on content reuse and rich media delivery, and their team specializes in meeting the unique needs of commercial publishers and media / entertainment companies.",
            imageURL: "http://www.marklogicevents.com/img/sponsors/FlatironsSolutionsLeft.jpg",
            websiteFull: "http://flatironssolutions.com",
            websitePretty: "flatironssolutions.com"
        },
        {
            id: "16",
            company: "MLJSON",
            level: "Additional Sponsors",
            info: "<div style='width: 500px;'>The MLJSON project is a set of libraries and REST endpoints to enable the MarkLogic Server to become an advanced JSON store.<br><br>" +
            "<h4>MarkLogic</h4>" +
            "• High-performance, scalable database for unstructured information<br>" + 
            '• "NoSQL" datastore (no tables, rows, columns) - just documents and unique IDs (URIs).<br>' + 
            "• Uses XML datamodel for documents, query-able via XQuery, XSLT, XPath<br>" + 
            "• Uses search-engine techniques to efficiently expose real-time fulltext search<br>" + 
            "• ACID-compliant CRUD (Create, Read, Update, Delete)<br><br>" + 
            "<h4>JSON</h4>" +
            "• JavaScript Object Notation<br>" + 
            "• A lightweight data-encoding and interchange format<br>" + 
            "• Native to JavaScript, now widely utilized across languages<br>" + 
            "• Commonly used for passing data to web browsers<br>" + 
            "• Design goal<br>" + 
            "• Enable developers to store and search/query JSON inside MarkLogic (without knowledge of XQuery, XSLT, or XPath)<br><br>" + 
            
            "<h4>Design considerations:</h4>" +
            "1) Approach things from a JSON angle<br>" + 
            "2) Create the XML to match the JSON, not vice-versa<br>" + 
            "3) Make good use of MarkLogic indexes<br>" + 
            "4) Craft the XML so it's fast to query<br>" + 
            "5) XML representation of JSON is an implementation detail - users only need think in terms of JSON<br><br>" + 
            "<h4>Overview</h4>" +
            "MLJSON exposes REST endpoints that allow a developer to easily store and retrieve JSON documents from the database (CRUD). It also exposes a very powerful query interface that uses a native JSON syntax:<br><br>" +
            "Query using native JSON syntax - Don't expose the XML internals to users - Support full range of MarkLogic indexes<br><br>" +
            "This query interface allows the user to find documents via \"path\" expressions as well as full text search expressions. For those familiar with MarkLogic, it exposes all of the functionality found in the CTS search functions.<br><br>" +
            "<h4>Presentation</h4>" +
            "Here are some <a href='http://www.xmlprague.cz/2011/presentations/jason-hunter-mljson.pdf'>slides</a> from a presentation on MLJSON given at XML Prague 2011.</div>",
            imageURL: "http://developer.marklogic.com/media/marklogic-community-badge.png",
            websiteFull: "http://developer.marklogic.com",
            websitePretty: "developer.marklogic.com"
        }
    ]
});


mluc.createCookie = function(name, value, days) {
    var expires;
    if(days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/; domain=" + document.domain + ";";
};

mluc.readCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    var i;
    for(i = 0; i < ca.length; i += 1) {
        var c = ca[i];
        while(c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if(c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
};

mluc.eraseCookie = function(name) {
    mluc.createCookie(name, "", -1);
};

mluc.login = function() {
    window.location = "/oauth2/login.xqy";
};

mluc.logout = function() {
    mluc.eraseCookie("MLUC-SESSION");
    mluc.eraseCookie("MLUC-USERNAME");
    mluc.eraseCookie("MLUC-NAME");
};

mluc.isLoggedIn = function() {
    var username = mluc.readCookie("MLUC-USERNAME");
    return username && username.length > 0;
};


mluc.friendlyDateSince = function(time) {
    var currentTime = new Date();
    var sinceMin = Math.round((currentTime - time) / 60000);
    var since = '';
    if(sinceMin === 0) {
        var sinceSec = Math.round((currentTime - time) / 1000);
        if(sinceSec < 10) {
            since = 'less than 10 seconds ago';
        }
        else if(sinceSec < 20) {
            since = 'less than 20 seconds ago';
        }
        else {
            since = 'half a minute ago';
        }
    }
    else if(sinceMin === 1) {
        var sinceSec = Math.round((currentTime - time) / 1000);
        if(sinceSec === 30) {
            since = 'half a minute ago';
        }
        else if(sinceSec < 60) {
            since = 'less than a minute ago';
        }
        else {
            since = '1 minute ago';
        }
    }   
    else if(sinceMin < 45) {
        since = sinceMin + ' minutes ago';
    }
    else if(sinceMin > 44 && sinceMin < 60) {
        since = 'about 1 hour ago';
    }
    else if(sinceMin < 1440) {
        var sinceHr = Math.round(sinceMin / 60);
        if(sinceHr === 1) {
            since = 'about 1 hour ago';
        }
        else {
            since = 'about ' + sinceHr + ' hours ago';
        }
    }
    else if(sinceMin > 1439 && sinceMin < 2880) {
        since = '1 day ago';
    }
    else {
        var sinceDay = Math.round(sinceMin / 1440);
        since = sinceDay + ' days ago';
    } 

    return since;
};
