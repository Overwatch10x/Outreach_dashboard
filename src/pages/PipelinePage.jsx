import PipelineRunsLog from '../components/PipelineRunsLog';
import FailureBreakdown from '../components/FailureBreakdown';
import './PipelinePage.css';

export default function PipelinePage({ view }) {
  return (
    <div className="pipeline-page page-fade">
      <PipelineRunsLog runs={view.raw.pipelineRuns} />
      <FailureBreakdown
        byPhase={view.failures.byPhase}
        topErrors={view.failures.topErrors}
        pipelineRuns={view.raw.pipelineRuns}
      />
    </div>
  );
}
