import ApolloKeyStatus from '../components/ApolloKeyStatus';
import './KeysPage.css';

export default function KeysPage({ view }) {
  return (
    <div className="keys-page page-fade">
      <ApolloKeyStatus
        registered={view.keyHealth.registered}
        unregistered={view.keyHealth.unregistered}
        creditUsage={view.creditUsage}
      />
    </div>
  );
}
