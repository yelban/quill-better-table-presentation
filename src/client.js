// import { getUsers } from "./es/usersAPI";            // 靜態導入
// const getUserModule = () => import("./es/usersAPI");    // 動態導入, The lazy "chunk" is 0.js.
// const getUserModule = () => import(/* webpackChunkName: "usersAPI" */ "./es/usersAPI"); // 動態導入, 指定 lazy "chunk" 名稱

// const ReconnectingWebSocket = require('reconnecting-websocket');
// Uncaught TypeError: ReconnectingWebSocket is not a constructor
import ReconnectingWebSocket from 'reconnecting-websocket';
import ShareDB from 'sharedb/lib/client';
import RichText from 'rich-text';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import QuillBetterTable from 'quill-better-table/dist/quill-better-table';
// import * as QuillTableUI from 'quill-table-ui';
import Tinycolor from 'tinycolor2';
import ObjectID from 'bson-objectid';

// import moment from "moment";
// import "quill/dist/quill";

import "quill/dist/quill.snow.css";
import "quill-better-table/dist/quill-better-table.css";
// import "quill-table-ui/dist/index.css";
import "./style.css";

ShareDB.types.register(RichText.type);
Quill.register({
    'modules/cursors': QuillCursors,
    'modules/better-table': QuillBetterTable
    // 'modules/tableUI': QuillTableUI.default
}, true);

const connectionButton = document.getElementById('client-connection');
connectionButton.addEventListener('click', function () {
    toggleConnection(connectionButton);
});

const nameInput = document.getElementById('name');

const colors = {};

const collection = 'aitba';
const id = 'wiki001n1';
const presenceId = new ObjectID().toString();

const socket = new ReconnectingWebSocket('ws://' + window.location.host);
const connection = new ShareDB.Connection(socket);
connection.debug = true;

const doc = connection.get(collection, id);

doc.subscribe(function (err) {
    if (err) throw err;
    initialiseQuill(doc);
});

function initialiseQuill(doc) {
    const toolbarOptions = [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["link", "image"],
        [{ size: ["small", false, "large", "huge"] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ["clean"]
    ];

    const quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            cursors: true,
            toolbar: {
                container: toolbarOptions,
                handlers: {
                    image: imageHandler
                },
            },
            table: false,  // disable table module
            'better-table': {
                operationMenu: {
                    items: {
                        unmergeCells: {
                            text: 'Another unmerge cells name'
                        }
                    },
                    color: {
                        colors: ['green', 'red', 'yellow', 'blue', 'white'],
                        text: 'Background Colors:'
                    }
                }
            },
            keyboard: {
                bindings: QuillBetterTable.keyboardBindings
            },
            // table: true,
            // tableUI: true,
        }
    });

    const cursors = quill.getModule('cursors');

    const tableModule = quill.getModule('better-table');
    document.querySelector('#insert-table')
        .addEventListener( 'click', () => {
            tableModule.insertTable(3, 3);
        });

    document.querySelector('#get-table')
        .addEventListener( 'click', () => {
            console.log(tableModule.getTable());
        });

    document.querySelector('#get-contents')
        .addEventListener( 'click', () => {
            console.log(quill.getContents());
        });

    // const table = quill.getModule('table');
    // document.querySelector('#insert-table').addEventListener('click', function () {
    //     table.insertTable(3, 3);
    // });

    function imageHandler() {
        const range = this.quill.getSelection();
        const value = prompt('What is the image URL');
        if (value) {
            this.quill.insertEmbed(range.index, 'image', value, Quill.sources.USER);
        }
    }

    quill.setContents(doc.data);

    quill.on('text-change', function (delta, oldDelta, source) {
        console.log('delta', delta);
        console.log('source', source);
        if (source !== 'user') return;
        doc.submitOp(delta);
    });

    doc.on('op', function (op, source) {
        if (source) return;
        quill.updateContents(op);
    });

    const presence = doc.connection.getDocPresence(collection, id);
    presence.subscribe(function (error) {
        if (error) throw error;
    });
    const localPresence = presence.create(presenceId);

    quill.on('selection-change', function (range) {
        // Ignore blurring, so that we can see lots of users in the
        // same window. In real use, you may want to clear the cursor.
        if (!range) return;
        // In this particular instance, we can send extra information
        // on the presence object. This ability will vary depending on
        // type.
        range.name = nameInput.value;
        localPresence.submit(range, function (error) {
            if (error) throw error;
        });
    });

    presence.on('receive', function (id, range) {
        colors[id] = colors[id] || Tinycolor.random().toHexString();
        const name = (range && range.name) || '安娜惹牧師';
        cursors.createCursor(id, name, colors[id]);
        cursors.moveCursor(id, range);
    });

    return quill;
}

function toggleConnection(button) {
    if (button.classList.contains('connected')) {
        button.classList.remove('connected');
        button.textContent = '上線';
        disconnect();
    } else {
        button.classList.add('connected');
        button.textContent = '下線';
        connect();
    }
}

function disconnect() {
    doc.connection.close();
}

function connect() {
    const socket = new ReconnectingWebSocket('ws://' + window.location.host);
    doc.connection.bindToSocket(socket);
}
