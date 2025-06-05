import { createServiceClient } from '@/lib/supabase/unified-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // Test 1: Simple count
    const { count: dealsCount, error: dealsCountError } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });
      
    if (dealsCountError) {
      return NextResponse.json({ 
        error: 'Failed at deals count', 
        details: dealsCountError.message 
      }, { status: 500 });
    }
    
    // Test 2: Fetch deals without stage column
    const { data: dealsData, error: dealsError } = await supabase
      .from('deals')
      .select('id, status, created_at');
      
    if (dealsError) {
      return NextResponse.json({ 
        error: 'Failed at deals select', 
        details: dealsError.message 
      }, { status: 500 });
    }
    
    // Test 3: Check if stage column causes issues
    const { data: dealsWithStage, error: stageError } = await supabase
      .from('deals')
      .select('id, stage')
      .limit(1);
      
    if (stageError) {
      return NextResponse.json({ 
        error: 'Failed at stage column', 
        details: stageError.message,
        note: 'Stage column might be the issue'
      }, { status: 500 });
    }
    
    // Test 4: Tasks query
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at')
      .eq('status', 'in-progress');
      
    if (tasksError) {
      return NextResponse.json({ 
        error: 'Failed at tasks query', 
        details: tasksError.message 
      }, { status: 500 });
    }
    
    // Test 5: Interactions query
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('interactions')
      .select('id, interaction_type, interaction_date, summary')
      .gte('interaction_date', oneWeekAgo.toISOString());
      
    if (activitiesError) {
      return NextResponse.json({ 
        error: 'Failed at interactions query', 
        details: activitiesError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      dealsCount,
      dealsData: dealsData?.length || 0,
      hasStageColumn: !!dealsWithStage,
      tasksCount: tasksData?.length || 0,
      activitiesCount: activitiesData?.length || 0,
      message: 'All queries successful!'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
