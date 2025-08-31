import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  VStack,
  HStack,
  Badge,
  Icon,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  FiFilm, 
  FiBook, 
  FiPlay, 
  FiTrendingUp,
  FiClock,
  FiHeart,
  FiEye
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Components
import QuickActions from '../components/Dashboard/QuickActions';
import RecentMovies from '../components/Dashboard/RecentMovies';
import MovieGenerationProgress from '../components/Dashboard/MovieGenerationProgress';
import InspirationQuotes from '../components/Dashboard/InspirationQuotes';

// Hooks
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

// API
import { api } from '../utils/api';

// API calls
const fetchDashboardData = async () => {
  const [statsRes, moviesRes, diaryRes] = await Promise.all([
    api.get('/user/stats'),
    api.get('/movie?limit=5'),
    api.get('/diary?limit=3')
  ]);

  return {
    stats: statsRes.data,
    recentMovies: moviesRes.data.movies,
    recentDiaries: diaryRes.data.diary_entries
  };
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  const [generatingMovies, setGeneratingMovies] = useState([]);

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleMovieProgress = (data) => {
      setGeneratingMovies(prev => {
        const existing = prev.findIndex(m => m.movieId === data.movieId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...data };
          return updated;
        }
        return [...prev, data];
      });

      // Remove from list when completed
      if (data.status === 'completed' || data.status === 'failed') {
        setTimeout(() => {
          setGeneratingMovies(prev => prev.filter(m => m.movieId !== data.movieId));
          queryClient.invalidateQueries(['dashboard']);
        }, 2000);
      }
    };

    socket.on('movie_progress', handleMovieProgress);

    return () => {
      socket.off('movie_progress', handleMovieProgress);
    };
  }, [socket, queryClient]);

  const handleCreateMovie = () => {
    navigate('/diary?new=true');
  };

  const handleViewAllMovies = () => {
    navigate('/movies');
  };

  const handleViewAllDiaries = () => {
    navigate('/diary');
  };

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" rounded="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Something went wrong!</AlertTitle>
            <AlertDescription>
              Unable to load dashboard data. Please try refreshing the page.
            </AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Welcome Section */}
      <Box mb={8}>
        <Heading size="2xl" color="brand.400" fontFamily="heading">
          Welcome back, {user?.first_name}! 🎬
        </Heading>
        <Text fontSize="lg" color="gray.400" mt={2}>
          Ready to turn your stories into cinematic experiences?
        </Text>
      </Box>

      {/* Movie Generation Progress */}
      {generatingMovies.length > 0 && (
        <Box mb={8}>
          <VStack spacing={4}>
            {generatingMovies.map((movie) => (
              <MovieGenerationProgress
                key={movie.movieId}
                movieId={movie.movieId}
                progress={movie.progress}
                status={movie.status}
                message={movie.message}
              />
            ))}
          </VStack>
        </Box>
      )}

      {/* Stats Overview */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6} mb={8}>
        <GridItem>
          <Card bg="dark.800" border="1px" borderColor="dark.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">
                  <HStack>
                    <Icon as={FiFilm} />
                    <Text>Movies Created</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="brand.400" fontSize="3xl">
                  {isLoading ? <Skeleton height="40px" /> : dashboardData?.stats?.total_movies || 0}
                </StatNumber>
                <StatHelpText color="gray.500">
                  +{dashboardData?.stats?.movies_this_month || 0} this month
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg="dark.800" border="1px" borderColor="dark.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">
                  <HStack>
                    <Icon as={FiBook} />
                    <Text>Diary Entries</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="brand.400" fontSize="3xl">
                  {isLoading ? <Skeleton height="40px" /> : dashboardData?.stats?.total_diaries || 0}
                </StatNumber>
                <StatHelpText color="gray.500">
                  +{dashboardData?.stats?.diaries_this_week || 0} this week
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg="dark.800" border="1px" borderColor="dark.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">
                  <HStack>
                    <Icon as={FiClock} />
                    <Text>Total Watch Time</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="brand.400" fontSize="3xl">
                  {isLoading ? <Skeleton height="40px" /> : `${Math.round((dashboardData?.stats?.total_watch_time || 0) / 60)}m`}
                </StatNumber>
                <StatHelpText color="gray.500">
                  Across all movies
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card bg="dark.800" border="1px" borderColor="dark.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">
                  <HStack>
                    <Icon as={FiEye} />
                    <Text>Total Views</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="brand.400" fontSize="3xl">
                  {isLoading ? <Skeleton height="40px" /> : dashboardData?.stats?.total_views || 0}
                </StatNumber>
                <StatHelpText color="gray.500">
                  From shared movies
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
        {/* Left Column */}
        <GridItem>
          <VStack spacing={8} align="stretch">
            {/* Quick Actions */}
            <Card bg="dark.800" border="1px" borderColor="dark.600">
              <CardHeader>
                <Heading size="md" color="white">Quick Actions</Heading>
              </CardHeader>
              <CardBody>
                <QuickActions
                  onCreateMovie={handleCreateMovie}
                  onViewMovies={handleViewAllMovies}
                  onViewDiaries={handleViewAllDiaries}
                />
              </CardBody>
            </Card>

            {/* Recent Movies */}
            <Card bg="dark.800" border="1px" borderColor="dark.600">
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md" color="white">Recent Movies</Heading>
                  <Button size="sm" variant="ghost" onClick={handleViewAllMovies}>
                    View All
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                {isLoading ? (
                  <VStack spacing={4}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height="80px" />
                    ))}
                  </VStack>
                ) : (
                  <RecentMovies movies={dashboardData?.recentMovies || []} />
                )}
              </CardBody>
            </Card>
          </VStack>
        </GridItem>

        {/* Right Column */}
        <GridItem>
          <VStack spacing={8} align="stretch">
            {/* Subscription Status */}
            <Card bg="dark.800" border="1px" borderColor="dark.600">
              <CardHeader>
                <Heading size="md" color="white">Subscription</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="start">
                  <HStack>
                    <Badge 
                      colorScheme={user?.subscription_tier === 'free' ? 'gray' : 'brand'}
                      size="lg"
                      textTransform="capitalize"
                    >
                      {user?.subscription_tier || 'Free'}
                    </Badge>
                  </HStack>
                  
                  <Text color="gray.400" fontSize="sm">
                    {user?.subscription_tier === 'free' 
                      ? 'Upgrade for unlimited movies and premium features!'
                      : 'Enjoy unlimited movie creation and premium features!'
                    }
                  </Text>

                  {user?.subscription_tier === 'free' && (
                    <Progress 
                      value={((dashboardData?.stats?.movies_today || 0) / 1) * 100} 
                      colorScheme="brand"
                      size="sm"
                      w="full"
                    />
                  )}

                  <Button 
                    size="sm" 
                    colorScheme="brand"
                    onClick={() => navigate('/subscription')}
                  >
                    {user?.subscription_tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Daily Inspiration */}
            <Card bg="dark.800" border="1px" borderColor="dark.600">
              <CardHeader>
                <Heading size="md" color="white">Daily Inspiration</Heading>
              </CardHeader>
              <CardBody>
                <InspirationQuotes />
              </CardBody>
            </Card>

            {/* Recent Diary Entries */}
            <Card bg="dark.800" border="1px" borderColor="dark.600">
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md" color="white">Recent Entries</Heading>
                  <Button size="sm" variant="ghost" onClick={handleViewAllDiaries}>
                    View All
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody>
                {isLoading ? (
                  <VStack spacing={3}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height="60px" />
                    ))}
                  </VStack>
                ) : dashboardData?.recentDiaries?.length > 0 ? (
                  <VStack spacing={3} align="stretch">
                    {dashboardData.recentDiaries.map((entry) => (
                      <Box 
                        key={entry.id}
                        p={3}
                        bg="dark.700"
                        rounded="md"
                        border="1px"
                        borderColor="dark.600"
                        cursor="pointer"
                        _hover={{ borderColor: 'brand.400' }}
                        onClick={() => navigate(`/diary?entry=${entry.id}`)}
                      >
                        <Text fontSize="sm" fontWeight="medium" color="white" noOfLines={1}>
                          {entry.title || 'Untitled Entry'}
                        </Text>
                        <Text fontSize="xs" color="gray.400" noOfLines={2} mt={1}>
                          {entry.content}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                    No diary entries yet. Start writing your story!
                  </Text>
                )}
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default DashboardPage;