import {render, screen} from '@testing-library/react';
import React from 'react';
import {Provider} from 'react-redux';

import teacherPanel from '@cdo/apps/code-studio/teacherPanelRedux';
import {
  getStore,
  registerReducers,
  stubRedux,
  restoreRedux,
} from '@cdo/apps/redux';
import RubricContent from '@cdo/apps/templates/rubrics/RubricContent';
import teacherRubric from '@cdo/apps/templates/rubrics/teacherRubricRedux';
import teacherSections from '@cdo/apps/templates/teacherDashboard/teacherSectionsRedux';

describe('RubricContent', () => {
  let store;
  beforeEach(() => {
    stubRedux();
    registerReducers({teacherRubric, teacherSections, teacherPanel});
    store = getStore();
  });

  afterEach(() => {
    restoreRedux();
  });

  const defaultRubric = {
    id: 1,
    learningGoals: [
      {
        id: 1,
        key: '1',
        learningGoal: 'goal 1',
        aiEnabled: false,
        evidenceLevels: [],
      },
      {
        id: 2,
        key: '2',
        learningGoal: 'goal 2',
        aiEnabled: true,
        evidenceLevels: [],
      },
    ],
    lesson: {
      position: 3,
      name: 'Data Structures',
      title: 'Data Structures',
    },
    level: {
      name: 'test_level',
      position: 7,
    },
  };

  const studentLevelInfo = {
    name: 'Grace Hopper',
    timeSpent: 305,
    lastAttempt: '1980-07-31T00:00:00.000Z',
    attempts: 6,
  };

  const defaultProps = {
    rubric: defaultRubric,
    teacherHasEnabledAi: true,
    studentLevelInfo: studentLevelInfo,
    canProvideFeedback: true,
    onLevelForEvaluation: true,
    visible: true,
    sectionId: 1,
  };

  const aiEvaluations = [
    {id: 2, learning_goal_id: 2, understanding: 2, aiConfidencePassFail: 2},
  ];

  it('displays LearningGoals component with learning goals when viewing student work on assessment level', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} aiEvaluations={aiEvaluations} />
      </Provider>
    );

    expect(screen.getByText('goal 1')).toBeInTheDocument();
    expect(screen.getByText('goal 2')).toBeInTheDocument();
  });

  it('displays Student and Section selectors', () => {
    const {container} = render(
      <Provider store={store}>
        <RubricContent {...defaultProps} />
      </Provider>
    );

    // eslint-disable-next-line no-restricted-properties
    expect(container.querySelector('.selectors')).toBeInTheDocument();
  });

  it('shows learning goals when viewing student work on non assessment level', () => {
    render(
      <Provider store={store}>
        <RubricContent
          {...defaultProps}
          studentLevelInfo={{name: 'Grace Hopper', timeSpent: 706}}
          canProvideFeedback={false}
          onLevelForEvaluation={false}
        />
      </Provider>
    );

    expect(screen.getByText('goal 1')).toBeInTheDocument();
    expect(screen.getByText('goal 2')).toBeInTheDocument();
  });

  it('shows learning goals when not viewing student work', () => {
    render(
      <Provider store={store}>
        <RubricContent
          {...defaultProps}
          studentLevelInfo={null}
          canProvideFeedback={false}
        />
      </Provider>
    );

    expect(screen.getByText('goal 1')).toBeInTheDocument();
    expect(screen.getByText('goal 2')).toBeInTheDocument();
  });

  it('shows level title when teacher is viewing student work', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Data Structures')).toBeInTheDocument();
  });

  it('shows level title when teacher is not viewing student work', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} studentLevelInfo={null} />
      </Provider>
    );

    expect(screen.getByText('Data Structures')).toBeInTheDocument();
  });

  it('shows student data if provided', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText(/time spent 5m 5s/i)).toBeInTheDocument();
    expect(screen.getByText(/6 attempts/i)).toBeInTheDocument();
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });

  it('handles missing student data', () => {
    render(
      <Provider store={store}>
        <RubricContent
          {...defaultProps}
          studentLevelInfo={{
            name: 'Grace Hopper',
          }}
        />
      </Provider>
    );

    expect(screen.queryByText(/time spent/i)).not.toBeInTheDocument();
    expect(screen.getByText(/0 attempts/i)).toBeInTheDocument();
    expect(screen.queryByText(/last updated/i)).not.toBeInTheDocument();
  });

  it('doesnt show student level data if not on level for evaluation', () => {
    render(
      <Provider store={store}>
        <RubricContent
          {...defaultProps}
          studentLevelInfo={{
            name: 'Grace Hopper',
            attempts: 6,
          }}
          canProvideFeedback={false}
          onLevelForEvaluation={false}
        />
      </Provider>
    );

    expect(screen.queryByText(/6 attempts/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Feedback will be available on Level 7/i)
    ).toBeInTheDocument();
  });

  it('does not show AI evaluations when teacher has disabled AI', () => {
    render(
      <Provider store={store}>
        <RubricContent
          {...defaultProps}
          teacherHasEnabledAi={false}
          aiEvaluations={aiEvaluations}
        />
      </Provider>
    );

    expect(screen.getByText('goal 1')).toBeInTheDocument();
    expect(screen.getByText('goal 2')).toBeInTheDocument();
  });

  it('shows info alert when not viewing project level', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} onLevelForEvaluation={false} />
      </Provider>
    );

    // eslint-disable-next-line no-restricted-properties
    expect(screen.getByTestId('info-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Rubrics can only be evaluated on project levels/i)
    ).toBeInTheDocument();
  });

  it('shows info alert when not viewing student work', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} studentLevelInfo={null} />
      </Provider>
    );

    // eslint-disable-next-line no-restricted-properties
    expect(screen.getByTestId('info-alert')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Select a student from the dropdown menu to view and evaluate their work/i
      )
    ).toBeInTheDocument();
  });
});
