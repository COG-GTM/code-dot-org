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

let mockLearningGoalsProps = {};
let mockSectionSelectorRendered = false;
let mockStudentSelectorRendered = false;

jest.mock('@cdo/apps/templates/rubrics/LearningGoals', () => {
  return function MockLearningGoals(props) {
    mockLearningGoalsProps = props;
    return (
      <div data-testid="learning-goals">
        {props.learningGoals?.map(lg => (
          <div key={lg.id}>{lg.learningGoal}</div>
        ))}
      </div>
    );
  };
});

jest.mock('@cdo/apps/templates/rubrics/SectionSelector', () => {
  return function MockSectionSelector() {
    mockSectionSelectorRendered = true;
    return <div data-testid="section-selector" />;
  };
});

jest.mock('@cdo/apps/templates/rubrics/StudentSelector', () => {
  return function MockStudentSelector() {
    mockStudentSelectorRendered = true;
    return <div data-testid="student-selector" />;
  };
});

describe('RubricContent', () => {
  let store;
  beforeEach(() => {
    stubRedux();
    registerReducers({teacherRubric, teacherSections, teacherPanel});
    store = getStore();
    mockLearningGoalsProps = {};
    mockSectionSelectorRendered = false;
    mockStudentSelectorRendered = false;
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

  it('displays LearningGoals component with correct props when viewing student work on assessment level', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} aiEvaluations={aiEvaluations} />
      </Provider>
    );

    expect(screen.getByTestId('learning-goals')).toBeInTheDocument();
    expect(mockLearningGoalsProps.studentLevelInfo).toBe(studentLevelInfo);
    expect(mockLearningGoalsProps.learningGoals).toBe(
      defaultRubric.learningGoals
    );
    expect(mockLearningGoalsProps.aiEvaluations).toBe(aiEvaluations);
  });

  it('displays Student and Section selectors', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} />
      </Provider>
    );

    expect(screen.getByTestId('section-selector')).toBeInTheDocument();
    expect(screen.getByTestId('student-selector')).toBeInTheDocument();
    expect(mockSectionSelectorRendered).toBe(true);
    expect(mockStudentSelectorRendered).toBe(true);
  });

  it('shows learning goals with correct props when viewing student work on non assessment level', () => {
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

    expect(screen.getByTestId('learning-goals')).toBeInTheDocument();
    expect(mockLearningGoalsProps.learningGoals).toBe(
      defaultRubric.learningGoals
    );
    expect(mockLearningGoalsProps.canProvideFeedback).toBe(false);
  });

  it('shows learning goals with correct props when not viewing student work', () => {
    render(
      <Provider store={store}>
        <RubricContent
          {...defaultProps}
          studentLevelInfo={null}
          canProvideFeedback={false}
        />
      </Provider>
    );

    expect(screen.getByTestId('learning-goals')).toBeInTheDocument();
    expect(mockLearningGoalsProps.learningGoals).toBe(
      defaultRubric.learningGoals
    );
    expect(mockLearningGoalsProps.canProvideFeedback).toBe(false);
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

  it('does not pass down AI analysis to components when teacher has disabled AI', () => {
    render(
      <Provider store={store}>
        <RubricContent {...defaultProps} teacherHasEnabledAi={false} />
      </Provider>
    );

    expect(mockLearningGoalsProps.aiEvaluations).not.toBe(aiEvaluations);
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
