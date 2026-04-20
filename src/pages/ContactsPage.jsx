import ContactLog from '../components/ContactLog';
import DuplicateOutreach from '../components/DuplicateOutreach';
import './ContactsPage.css';

export default function ContactsPage({ view }) {
  return (
    <div className="contacts-page page-fade">
      <ContactLog contacts={view.raw.contacts} />
      <DuplicateOutreach duplicates={view.duplicates} />
    </div>
  );
}
