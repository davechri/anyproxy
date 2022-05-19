import './App.css';
import '@fortawesome/fontawesome-free/css/all.css';
import 'bootstrap-css-only/css/bootstrap.css';
import Snapshots from './components/SnapshotTabs';
import Header from './components/Header';
import { filterStore } from './store/FilterStore';
import { socketStore } from './store/SocketStore';
import { messageQueueStore } from './store/MessageQueueStore';
import { snapshotStore } from './store/SnapshotStore';

function App() {
  return (
    <div className="App">
      <Header
        socketStore={socketStore}
        filterStore={filterStore}
        messageQueueStore={messageQueueStore}
        snapshotStore={snapshotStore}
      />
      <Snapshots
        messageQueueStore={messageQueueStore}
        snapshotStore={snapshotStore}
      />
    </div>
  );
}

export default App;
