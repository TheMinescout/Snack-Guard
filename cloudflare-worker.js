// Cloudflare Worker for SnackGuard Image Analysis
// Deploy this to Cloudflare Workers and update the Worker URL in the app settings

export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { oldPhoto, newPhoto } = await request.json();

      if (!oldPhoto || !newPhoto) {
        return new Response(
          JSON.stringify({ error: 'Both oldPhoto and newPhoto are required' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Use Cloudflare AI to analyze the images
      const differences = await analyzeImageDifferences(oldPhoto, newPhoto, env);

      return new Response(
        JSON.stringify({
          success: true,
          differences,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Analysis failed', 
          message: error.message 
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
  },
};

async function analyzeImageDifferences(oldPhotoBase64, newPhotoBase64, env) {
  // Decode base64 images
  const oldImageBuffer = Uint8Array.from(atob(oldPhotoBase64), c => c.charCodeAt(0));
  const newImageBuffer = Uint8Array.from(atob(newPhotoBase64), c => c.charCodeAt(0));

  // Use Cloudflare AI Vision model to describe both images
  const prompt = `Compare these two images of the same snack/food item taken at different times. 
  List all visible differences between the images, focusing on:
  1. Changes in the amount/quantity of food
  2. Changes in packaging (wrinkles, tears, clips, seals)
  3. Changes in arrangement or position
  4. Any signs of consumption or tampering
  
  Be specific and detailed. Format your response as a list of differences.`;

  try {
    // Call Cloudflare AI Workers AI
    // Note: You need to bind Workers AI to your worker in wrangler.toml:
    // [ai]
    // binding = "AI"
    
    const oldImageAnalysis = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: [...oldImageBuffer],
      prompt: "Describe this snack/food item in detail, including: packaging condition, amount visible, position of clips/seals, any identifying marks or features.",
      max_tokens: 512
    });

    const newImageAnalysis = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
      image: [...newImageBuffer],
      prompt: "Describe this snack/food item in detail, including: packaging condition, amount visible, position of clips/seals, any identifying marks or features.",
      max_tokens: 512
    });

    // Now ask AI to compare the descriptions
    const comparisonPrompt = `Compare these two descriptions of the same snack at different times:

OLD IMAGE: ${oldImageAnalysis.response}

NEW IMAGE: ${newImageAnalysis.response}

List specific differences that suggest consumption or tampering. Focus on:
- Amount/quantity changes
- Packaging condition changes
- Position changes of clips/seals
- Signs of access

Provide 3-5 bullet points of key differences.`;

    const comparison = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        { role: 'system', content: 'You are an expert at detecting differences in food packaging and consumption.' },
        { role: 'user', content: comparisonPrompt }
      ],
      max_tokens: 256
    });

    // Parse the differences into an array
    const differenceText = comparison.response || '';
    const differences = differenceText
      .split('\n')
      .filter(line => line.trim().match(/^[-•*\d.]/))
      .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(line => line.length > 0);

    return differences.length > 0 ? differences : [
      'Analysis complete. Review images manually for subtle changes.',
      'Consider the weight difference as primary evidence.'
    ];

  } catch (aiError) {
    console.error('AI analysis error:', aiError);
    
    // Fallback to pixel-based comparison if AI fails
    return performPixelComparison(oldImageBuffer, newImageBuffer);
  }
}

// Fallback: Simple pixel-based comparison
function performPixelComparison(oldImage, newImage) {
  // This is a simplified fallback - in production you'd want more sophisticated analysis
  const differences = [];
  
  // Calculate rough difference percentage based on buffer sizes
  const sizeDiff = Math.abs(oldImage.length - newImage.length);
  const sizeChangePercent = (sizeDiff / oldImage.length) * 100;
  
  if (sizeChangePercent > 5) {
    differences.push(`Image size changed by ${sizeChangePercent.toFixed(1)}% (may indicate content change)`);
  }
  
  if (newImage.length < oldImage.length) {
    differences.push('Image file size decreased (possibly less content in frame)');
  } else if (newImage.length > oldImage.length) {
    differences.push('Image file size increased (possibly more content or different lighting)');
  }
  
  differences.push('Visual comparison requires manual review');
  differences.push('Check for changes in bag fullness, clip position, or packaging wrinkles');
  
  return differences;
}
